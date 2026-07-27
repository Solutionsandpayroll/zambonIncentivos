import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../shared/database/prisma.service';
import { ScopeService } from '../../../common/scope/scope.service';
import {
  resolveScopeType,
  ScopeType,
} from '../../../common/constants/roles';
import { AuthenticatedUser } from '../../../common/types/authenticated-user';

interface JwtPayload {
  sub: string; // userId
  username: string;
  employeeId: string | null;
  roles: string[];
}

/**
 * Valida el access token y reconstruye el usuario autenticado en cada request,
 * resolviendo su alcance jerárquico vigente. Así el árbol de subordinados
 * siempre refleja el estado actual de org_hierarchy, no el del momento del login.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly scopeService: ScopeService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.secret')!,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    // Verifica que el usuario siga activo (revocación efectiva sin lista negra).
    const user = await this.prisma.appUser.findUnique({
      where: { userId: payload.sub },
      select: { userId: true, userStatus: true },
    });
    if (!user || user.userStatus !== 'ACTIVE') {
      throw new UnauthorizedException('Usuario inactivo o inexistente');
    }

    const scopeType = resolveScopeType(payload.roles);
    let subordinateEmployeeIds: string[] = [];
    if (
      (scopeType === ScopeType.HIERARCHY || scopeType === ScopeType.TEAM) &&
      payload.employeeId
    ) {
      subordinateEmployeeIds = await this.scopeService.resolveSubordinateTree(
        payload.employeeId,
      );
    }

    return {
      userId: payload.sub,
      username: payload.username,
      employeeId: payload.employeeId,
      roles: payload.roles,
      scope: { type: scopeType, subordinateEmployeeIds },
    };
  }
}

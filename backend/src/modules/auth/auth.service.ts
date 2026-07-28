import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../shared/database/prisma.service';
import {
  resolveScopeType,
  ScopeType,
} from '../../common/constants/roles';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { LoginDto } from './dto/login.dto';
import { AuthUserView, LoginResponse } from './dto/auth-response.dto';

interface JwtPayload {
  sub: string;
  username: string;
  employeeId: string | null;
  roles: string[];
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Valida credenciales contra app_user, verifica estado ACTIVE, carga roles,
   * emite access + refresh, y actualiza lastLoginAt. Mensaje de error genérico
   * (no revela si el usuario existe) — el detalle operativo lo pone la UI.
   */
  async login(dto: LoginDto): Promise<LoginResponse> {
    const user = await this.prisma.appUser.findUnique({
      where: { username: dto.username },
      include: { roles: { include: { role: true } } },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    if (user.userStatus !== 'ACTIVE') {
      throw new UnauthorizedException('Usuario inactivo');
    }

    const passwordOk = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordOk) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const roles = user.roles.map((ur) => ur.role.roleName);

    await this.prisma.appUser.update({
      where: { userId: user.userId },
      data: { lastLoginAt: new Date() },
    });

    const payload: JwtPayload = {
      sub: user.userId,
      username: user.username,
      employeeId: user.employeeId,
      roles,
    };

    return {
      ...this.issueTokens(payload),
      user: this.toUserView(payload, user.mustChangePassword),
    };
  }

  /** Renueva el access token a partir de un refresh token válido. */
  async refresh(refreshToken: string): Promise<LoginResponse> {
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.config.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    // Revalida que el usuario siga activo y recarga roles frescos.
    const user = await this.prisma.appUser.findUnique({
      where: { userId: payload.sub },
      include: { roles: { include: { role: true } } },
    });
    if (!user || user.userStatus !== 'ACTIVE') {
      throw new UnauthorizedException('Usuario inactivo o inexistente');
    }

    const fresh: JwtPayload = {
      sub: user.userId,
      username: user.username,
      employeeId: user.employeeId,
      roles: user.roles.map((ur) => ur.role.roleName),
    };

    return {
      ...this.issueTokens(fresh),
      user: this.toUserView(fresh, user.mustChangePassword),
    };
  }

  /**
   * Logout lógico. Con JWT sin lista negra persistida, la invalidación real del
   * access token ocurre por expiración corta; aquí dejamos el punto de extensión
   * (revocación de refresh) documentado. La UI descarta los tokens.
   */
  async logout(_user: AuthenticatedUser): Promise<void> {
    // Punto de extensión: persistir jti revocados o rotar un tokenVersion por
    // usuario. Hoy el logout es del lado cliente + expiración del access token.
    return;
  }

  /**
   * Perfil del usuario autenticado para GET /auth/me.
   * Consulta la base porque `mustChangePassword` cambia dentro de la vida del
   * token: leerlo del JWT devolvería un valor viejo tras el cambio.
   */
  async me(user: AuthenticatedUser): Promise<AuthUserView> {
    const fresh = await this.prisma.appUser.findUnique({
      where: { userId: user.userId },
      select: { mustChangePassword: true },
    });

    return {
      userId: user.userId,
      username: user.username,
      employeeId: user.employeeId,
      roles: user.roles,
      scope: { type: user.scope.type },
      mustChangePassword: fresh?.mustChangePassword ?? false,
    };
  }

  private issueTokens(payload: JwtPayload): {
    accessToken: string;
    refreshToken: string;
  } {
    const accessToken = this.jwt.sign(payload, {
      secret: this.config.get<string>('jwt.secret'),
      expiresIn: this.config.get<string>('jwt.expiresIn'),
    });
    const refreshToken = this.jwt.sign(payload, {
      secret: this.config.get<string>('jwt.refreshSecret'),
      expiresIn: this.config.get<string>('jwt.refreshExpiresIn'),
    });
    return { accessToken, refreshToken };
  }

  /**
   * `mustChangePassword` se pasa aparte y NO viaja dentro del JWT: el token vive
   * 15 minutos, así que un flag embebido seguiría diciendo "debe cambiarla"
   * después de que el usuario ya la cambió. Se lee de la base en cada respuesta.
   */
  private toUserView(
    payload: JwtPayload,
    mustChangePassword = false,
  ): AuthUserView {
    return {
      userId: payload.sub,
      username: payload.username,
      employeeId: payload.employeeId,
      roles: payload.roles,
      scope: { type: resolveScopeType(payload.roles) as ScopeType },
      mustChangePassword,
    };
  }
}

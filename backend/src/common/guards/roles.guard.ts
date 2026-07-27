import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AppRole } from '../constants/roles';
import { AuthenticatedUser } from '../types/authenticated-user';

/**
 * RBAC. Si el endpoint declara @Roles(...), exige que el usuario tenga al menos
 * uno de esos roles. El filtrado fino de alcance (jerarquía) vive en cada
 * servicio con el ScopeService — este guard solo cubre el gate por rol.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<AppRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const user = context.switchToHttp().getRequest()
      .user as AuthenticatedUser;
    const allowed = user?.roles?.some((r) => required.includes(r as AppRole));
    if (!allowed) {
      throw new ForbiddenException('No tiene permiso para esta operación');
    }
    return true;
  }
}

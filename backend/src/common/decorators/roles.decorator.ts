import { SetMetadata } from '@nestjs/common';
import { AppRole } from '../constants/roles';

export const ROLES_KEY = 'roles';

/**
 * Declara los roles permitidos para un endpoint.
 * Sin @Roles(), el endpoint solo exige estar autenticado.
 *   @Roles(AppRole.ADMIN, AppRole.NOMINA)
 */
export const Roles = (...roles: AppRole[]) => SetMetadata(ROLES_KEY, roles);

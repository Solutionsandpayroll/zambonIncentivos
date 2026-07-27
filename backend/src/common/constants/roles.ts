/**
 * Roles del sistema (persistidos en la tabla `role`).
 * El alcance de datos de cada rol se resuelve además por jerarquía.
 */
export enum AppRole {
  ADMIN = 'ADMIN',
  NOMINA = 'NOMINA',
  GERENTE = 'GERENTE',
  COORDINADOR = 'COORDINADOR',
  EMPLEADO = 'EMPLEADO',
}

/**
 * Tipo de alcance de datos derivado del rol:
 *  - ALL:       ve todo (ADMIN, NOMINA)
 *  - HIERARCHY: ve su árbol de subordinados (GERENTE)
 *  - TEAM:      ve su equipo (COORDINADOR)
 *  - SELF:      ve únicamente lo propio (EMPLEADO)
 */
export enum ScopeType {
  ALL = 'ALL',
  HIERARCHY = 'HIERARCHY',
  TEAM = 'TEAM',
  SELF = 'SELF',
}

/** Deriva el alcance más amplio a partir de los roles del usuario. */
export function resolveScopeType(roles: string[]): ScopeType {
  if (roles.includes(AppRole.ADMIN) || roles.includes(AppRole.NOMINA)) {
    return ScopeType.ALL;
  }
  if (roles.includes(AppRole.GERENTE)) return ScopeType.HIERARCHY;
  if (roles.includes(AppRole.COORDINADOR)) return ScopeType.TEAM;
  return ScopeType.SELF;
}

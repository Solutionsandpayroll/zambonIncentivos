import { ScopeType } from '../constants/roles';

/**
 * Identidad del usuario autenticado, adjuntada al request por la JwtStrategy.
 * `subordinateEmployeeIds` es el árbol de subordinados (directos + indirectos)
 * ya resuelto desde org_hierarchy — la base del filtro de alcance.
 */
export interface AuthenticatedUser {
  userId: string;
  username: string;
  employeeId: string | null;
  roles: string[];
  scope: {
    type: ScopeType;
    /** Vacío para SELF/ALL; poblado para HIERARCHY y TEAM. */
    subordinateEmployeeIds: string[];
  };
}

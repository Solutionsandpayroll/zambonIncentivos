import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { ScopeType } from '../constants/roles';
import { AuthenticatedUser } from '../types/authenticated-user';

/**
 * Filtro de alcance por jerarquía. Regla del negocio (USECASES §1, §5.2):
 * la autorización de DATOS se valida SIEMPRE en backend, nunca por confianza en
 * el frontend. Un GERENTE no recibe datos fuera de su árbol aunque pida un id
 * ajeno (→ 403).
 */
@Injectable()
export class ScopeService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resuelve el árbol de subordinados (directos e indirectos) de un empleado
   * desde org_hierarchy vigente (validTo nulo). BFS iterativo, protegido contra
   * ciclos. Incluye al propio empleado en el resultado.
   */
  async resolveSubordinateTree(rootEmployeeId: string): Promise<string[]> {
    const visited = new Set<string>([rootEmployeeId]);
    let frontier = [rootEmployeeId];

    while (frontier.length > 0) {
      const links = await this.prisma.orgHierarchy.findMany({
        where: {
          managerEmployeeId: { in: frontier },
          active: true,
          validTo: null,
        },
        select: { subordinateEmployeeId: true },
      });

      const next: string[] = [];
      for (const { subordinateEmployeeId } of links) {
        if (!visited.has(subordinateEmployeeId)) {
          visited.add(subordinateEmployeeId);
          next.push(subordinateEmployeeId);
        }
      }
      frontier = next;
    }

    return [...visited];
  }

  /**
   * Devuelve la lista de employeeIds que el usuario puede ver, o `null` si su
   * alcance es ALL (sin restricción → no se filtra). Úsalo para construir el
   * `where` de las consultas de datos.
   */
  allowedEmployeeIds(user: AuthenticatedUser): string[] | null {
    switch (user.scope.type) {
      case ScopeType.ALL:
        return null; // sin restricción
      case ScopeType.HIERARCHY:
      case ScopeType.TEAM:
        return user.scope.subordinateEmployeeIds;
      case ScopeType.SELF:
      default:
        return user.employeeId ? [user.employeeId] : [];
    }
  }

  /**
   * Verifica que el usuario tenga permiso sobre un empleado concreto.
   * Lanza 403 si está fuera de alcance.
   */
  assertCanAccessEmployee(
    user: AuthenticatedUser,
    targetEmployeeId: string,
  ): void {
    const allowed = this.allowedEmployeeIds(user);
    if (allowed === null) return; // ALL
    if (!allowed.includes(targetEmployeeId)) {
      throw new ForbiddenException(
        'El recurso solicitado está fuera de su alcance',
      );
    }
  }
}

/**
 * Lógica pura para dar de alta usuarios a partir de los empleados.
 *
 * Sin dependencias de Prisma ni de red: recibe datos planos y decide nombre de
 * usuario y rol, para poder probarlo sin base de datos.
 */

/** Roles del sistema (deben existir en la tabla `role`). */
export type AppRoleName = 'ADMIN' | 'NOMINA' | 'GERENTE' | 'COORDINADOR' | 'EMPLEADO';

/**
 * Cargo -> rol. El alcance de lo que cada uno ve lo determina el rol:
 * GERENTE ve su árbol jerárquico, COORDINADOR su equipo, EMPLEADO solo lo suyo.
 *
 * Se comparan en minúsculas y sin acentos, por subcadena, porque los cargos
 * llegan del Excel con variantes de escritura.
 */
const POSITION_RULES: { match: RegExp; role: AppRoleName }[] = [
  // Dirección y gerencia: ven el árbol completo bajo su mando.
  { match: /gerente regional|gerente de distrito|director|directora/, role: 'GERENTE' },
  // Coordinación: ve su equipo.
  { match: /coordinador/, role: 'COORDINADOR' },
  // Todo lo demás (representantes, especialistas) ve solo su liquidación.
  { match: /.*/, role: 'EMPLEADO' },
];

/** Quita acentos y pasa a minúsculas, para comparar cargos de forma estable. */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Rol que corresponde a un cargo. Sin cargo se asume EMPLEADO: es el rol de
 * menor alcance, así que un dato faltante nunca concede permisos de más.
 */
export function roleForPosition(positionName: string | null | undefined): AppRoleName {
  if (!positionName) return 'EMPLEADO';
  const normalized = normalize(positionName);
  for (const rule of POSITION_RULES) {
    if (rule.match.test(normalized)) return rule.role;
  }
  return 'EMPLEADO';
}

/**
 * Nombre de usuario a partir del documento: único por definición, sin acentos
 * ni colisiones entre homónimos, y cada persona lo sabe de memoria.
 */
export function usernameForDocument(documentNumber: string): string {
  return String(documentNumber).trim();
}

/** Un documento sirve como usuario solo si es un número de 6 a 11 dígitos. */
export function isUsableDocument(documentNumber: string | null | undefined): boolean {
  return /^\d{6,11}$/.test(String(documentNumber ?? '').trim());
}

/** Empleado tal como llega de la base, con lo necesario para decidir. */
export interface EmployeeInput {
  employeeId: string;
  fullName: string;
  documentNumber: string;
  positionName: string | null;
  hasUser: boolean;
}

/** Resultado de evaluar un empleado. */
export interface ProvisionPlan {
  employeeId: string;
  fullName: string;
  username: string;
  role: AppRoleName;
}

export interface ProvisionSkip {
  fullName: string;
  documentNumber: string;
  reason: 'ya tiene usuario' | 'documento inválido' | 'usuario duplicado';
}

/**
 * Decide qué usuarios crear. No escribe nada: devuelve el plan y los descartes
 * para que el llamador informe antes de tocar la base.
 */
export function planProvisioning(employees: EmployeeInput[]): {
  plans: ProvisionPlan[];
  skipped: ProvisionSkip[];
} {
  const plans: ProvisionPlan[] = [];
  const skipped: ProvisionSkip[] = [];
  const usernames = new Set<string>();

  for (const employee of employees) {
    if (employee.hasUser) {
      skipped.push({
        fullName: employee.fullName,
        documentNumber: employee.documentNumber,
        reason: 'ya tiene usuario',
      });
      continue;
    }

    if (!isUsableDocument(employee.documentNumber)) {
      skipped.push({
        fullName: employee.fullName,
        documentNumber: employee.documentNumber,
        reason: 'documento inválido',
      });
      continue;
    }

    const username = usernameForDocument(employee.documentNumber);
    // Dos empleados con el mismo documento serían un error de datos: crear el
    // segundo rompería la restricción de unicidad a mitad de la carga.
    if (usernames.has(username)) {
      skipped.push({
        fullName: employee.fullName,
        documentNumber: employee.documentNumber,
        reason: 'usuario duplicado',
      });
      continue;
    }
    usernames.add(username);

    plans.push({
      employeeId: employee.employeeId,
      fullName: employee.fullName,
      username,
      role: roleForPosition(employee.positionName),
    });
  }

  return { plans, skipped };
}

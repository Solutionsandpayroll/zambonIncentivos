import { Decimal } from '@prisma/client/runtime/library';

/** Mappers entidad Prisma → filas de reporte. Entrada laxa (el include garantiza relaciones). */

const num = (d: Decimal | null | undefined): number => (d ? d.toNumber() : 0);

function fullNameOf(p: {
  fullName: string | null;
  firstName: string;
  lastName: string;
}): string {
  return p.fullName ?? `${p.firstName} ${p.lastName}`.trim();
}

/** Fila de tabla consolidada (cédula, empleado, equipo, 80%, 20%, total, estado). */
export function toReportRow(h: any) {
  return {
    employeeId: h.employeeId,
    documentNumber: h.employee.person.documentNumber,
    fullName: fullNameOf(h.employee.person),
    team: h.team?.teamName ?? null,
    component80: num(h.component80Result),
    component20: num(h.component20Result),
    totalIncentive: num(h.totalIncentive),
    guaranteedPayApplied: h.guaranteedPayApplied,
    calculationVersion: h.calculationVersion,
    status: h.calculationStatus,
  };
}

/** Reporte individual con desglose 80% por componente + 20%. */
export function toEmployeeReport(h: any) {
  return {
    employee: {
      documentNumber: h.employee.person.documentNumber,
      fullName: fullNameOf(h.employee.person),
      team: h.team?.teamName ?? null,
    },
    period: {
      year: h.period.periodYear,
      month: h.period.periodMonth,
      type: h.period.periodType,
    },
    baseSalary: num(h.baseSalary),
    component80: { theoretical: num(h.component80Theoretical), result: num(h.component80Result) },
    component20: {
      theoretical: num(h.component20Theoretical),
      result: num(h.component20Result),
      kpiResult: h.executionKpiResult ?? null,
      cycleMultiplier: h.executionCycleMultiplier,
    },
    totalIncentive: num(h.totalIncentive),
    guaranteedPayApplied: h.guaranteedPayApplied,
    calculationVersion: h.calculationVersion,
    details: (h.details ?? []).map((d: any) => ({
      component: d.component?.componentCode ?? d.componentId,
      quotaValue: num(d.quotaValue),
      saleValue: num(d.saleValue),
      compliancePercent: num(d.compliancePercent),
      curvePayPercent: num(d.curvePayPercent),
      componentIncentiveValue: num(d.componentIncentiveValue),
    })),
  };
}

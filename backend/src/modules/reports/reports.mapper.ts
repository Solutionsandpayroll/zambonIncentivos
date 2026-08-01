import { Decimal } from '@prisma/client/runtime/library';
import { computeIdealScenario } from '../incentives/domain/ideal-scenario';
import {
  defers20ToCycle,
  theoreticalMultiplierFor,
} from '../incentives/domain/execution-rules';

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
  const totalIncentive = num(h.totalIncentive);
  // Escenario ideal: lo que ganaría cumpliendo el 100%. Se deriva de las bolsas
  // teóricas que ya están guardadas en el header, sin recalcular nada.
  const ideal = computeIdealScenario(
    {
      component80Theoretical: num(h.component80Theoretical),
      component20Theoretical: num(h.component20Theoretical),
      executionCycleMultiplier: theoreticalMultiplierFor(h.executionPayMonthly ?? false),
      defers20ToCycle: defers20ToCycle(
        h.executionPayMonthly ?? false,
        h.period?.periodType ?? 'MONTH',
      ),
    },
    totalIncentive,
  );

  return {
    employeeId: h.employeeId,
    documentNumber: h.employee.person.documentNumber,
    fullName: fullNameOf(h.employee.person),
    team: h.team?.teamName ?? null,
    // El periodo viaja en la fila porque una exportación puede abarcar varios:
    // sin él, dos liquidaciones de la misma persona en meses distintos se leen
    // como duplicados.
    period: h.period
      ? `${h.period.periodYear}-${String(h.period.periodMonth).padStart(2, '0')}`
      : null,
    component80: num(h.component80Result),
    component20: num(h.component20Result),
    totalIncentive,
    idealTotal: ideal.idealTotal,
    achievementPercent: ideal.achievementPercent,
    // El logro de un mes que acumula mide solo el 80%: sin estas dos columnas
    // el porcentaje se leería como logro del ciclo y no lo es.
    achievementBase: ideal.achievementBase,
    achievementExcludes20: ideal.achievementExcludes20,
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
      // Decimal en la base (admite medias bolsas): se serializa como número.
      cycleMultiplier: num(h.executionCycleMultiplier),
    },
    totalIncentive: num(h.totalIncentive),
    ideal: computeIdealScenario(
      {
        component80Theoretical: num(h.component80Theoretical),
        component20Theoretical: num(h.component20Theoretical),
        executionCycleMultiplier: theoreticalMultiplierFor(h.executionPayMonthly ?? false),
        defers20ToCycle: defers20ToCycle(
          h.executionPayMonthly ?? false,
          h.period?.periodType ?? 'MONTH',
        ),
      },
      num(h.totalIncentive),
    ),
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

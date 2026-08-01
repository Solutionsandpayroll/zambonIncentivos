import { Decimal } from '@prisma/client/runtime/library';
import { computeIdealScenario } from '../incentives/domain/ideal-scenario';
import {
  defers20ToCycle,
  theoreticalMultiplierFor,
} from '../incentives/domain/execution-rules';

/**
 * Mappers de entidad Prisma → forma de respuesta del contrato (API.md §7).
 * Tipamos las entradas de forma laxa (el `include` del servicio garantiza las
 * relaciones presentes) para no acoplar a los tipos generados de Prisma.
 */

const num = (d: Decimal | null | undefined): number =>
  d ? d.toNumber() : 0;

function fullNameOf(person: {
  fullName: string | null;
  firstName: string;
  lastName: string;
}): string {
  return person.fullName ?? `${person.firstName} ${person.lastName}`.trim();
}

function primaryTeamName(employee: {
  teamAssignments?: { team: { teamName: string } }[];
}): string | null {
  return employee.teamAssignments?.[0]?.team.teamName ?? null;
}

export function toResultListItem(h: any) {
  return {
    headerId: h.incentiveCalculationHeaderId,
    employee: {
      employeeId: h.employeeId,
      documentNumber: h.employee.person.documentNumber,
      fullName: fullNameOf(h.employee.person),
    },
    team: h.team?.teamName ?? null,
    period: {
      periodId: h.periodId,
      year: h.period.periodYear,
      month: h.period.periodMonth,
      type: h.period.periodType,
    },
    totalIncentive: num(h.totalIncentive),
    guaranteedPayApplied: h.guaranteedPayApplied,
    calculationVersion: h.calculationVersion,
    calculationStatus: h.calculationStatus,
  };
}

export function toResultDetail(h: any) {
  return {
    headerId: h.incentiveCalculationHeaderId,
    employee: {
      // El id viaja para poder pedir el soporte individual
      // (POST /reports/export con type=EMPLOYEE lo exige).
      employeeId: h.employeeId,
      documentNumber: h.employee.person.documentNumber,
      fullName: fullNameOf(h.employee.person),
      team: primaryTeamName(h.employee),
    },
    period: {
      periodId: h.periodId,
      year: h.period.periodYear,
      month: h.period.periodMonth,
      type: h.period.periodType,
    },
    baseSalary: num(h.baseSalary),
    component80: {
      theoretical: num(h.component80Theoretical),
      result: num(h.component80Result),
    },
    component20: {
      theoretical: num(h.component20Theoretical),
      result: num(h.component20Result),
      kpiResult: h.executionKpiResult ?? null,
      // Decimal en la base (admite medias bolsas): se serializa como número.
      cycleMultiplier: num(h.executionCycleMultiplier),
    },
    totalIncentive: num(h.totalIncentive),
    // Escenario ideal: cuánto sería cumpliendo el 100% del 80% y del 20%.
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
      weightedComponentPercent: num(d.weightedComponentPercent),
      componentIncentiveValue: num(d.componentIncentiveValue),
    })),
  };
}

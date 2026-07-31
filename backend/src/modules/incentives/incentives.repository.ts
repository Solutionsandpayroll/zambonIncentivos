import { Injectable } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../shared/database/prisma.service';
import { EmployeeCalculationResult } from './domain/calculation-engine';
import { preferMonthOverCycle } from '../../shared/periods/parameter-precedence';

/** Insumos crudos de un empleado para un periodo, ya agregados. */
export interface EmployeeInputs {
  employeeId: string;
  teamId: string;
  teamCode: string | null;
  /** ¿El equipo cobra el 20% cada mes en vez de acumularlo al ciclo? */
  pays20Monthly: boolean;
  baseSalary: Decimal;
  /** venta agregada + cuota + peso por componente. */
  components: {
    componentId: string;
    quota: Decimal;
    sale: Decimal;
    weight: Decimal;
  }[];
  guaranteedPay: { apply80: boolean; apply20: boolean } | null;
  executionKpiResult: boolean;
}

@Injectable()
export class IncentivesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findPeriod(periodId: string) {
    return this.prisma.period.findUnique({ where: { periodId } });
  }

  /** Empleados con al menos una transacción de venta en el periodo. */
  async employeesWithSalesInPeriod(periodId: string): Promise<string[]> {
    const rows = await this.prisma.salesTransaction.findMany({
      where: { periodId },
      distinct: ['employeeId'],
      select: { employeeId: true },
    });
    return rows.map((r) => r.employeeId);
  }

  /**
   * Escalones de la curva de pago (global, componentId = null).
   *
   * `parameterPeriodIds` viene en orden de precedencia `[mes, ciclo]`: la curva
   * se define una vez en el ciclo y el mes puede sobreescribirla. La precedencia
   * es por componente y NUNCA mezcla — una escalera hecha de dos periodos
   * distintos no describe ninguna curva real.
   */
  async loadCurveSteps(parameterPeriodIds: string[]) {
    const rows = await this.prisma.curvePay.findMany({
      where: { periodId: { in: parameterPeriodIds }, active: true },
      select: {
        periodId: true,
        componentId: true,
        minCompliancePercent: true,
        payPercent: true,
        isCeiling: true,
      },
      orderBy: { minCompliancePercent: 'asc' },
    });

    const [monthId] = parameterPeriodIds;
    return preferMonthOverCycle(
      rows.filter((r) => r.periodId === monthId),
      rows.filter((r) => r.periodId !== monthId),
      (r) => r.componentId ?? 'GLOBAL',
    );
  }

  /**
   * Reúne todos los insumos de un empleado para el periodo: equipo vigente,
   * salario base, ventas agregadas por componente, cuotas, pesos del equipo,
   * KPI de ejecución y excepción de pago garantizado.
   */
  async loadEmployeeInputs(
    employeeId: string,
    periodId: string,
    /** `[mes, ciclo]` por precedencia. Sin ciclo padre es `[mes]`. */
    parameterPeriodIds: string[] = [periodId],
  ): Promise<EmployeeInputs | null> {
    // El equipo se resuelve A LA FECHA DEL PERIODO, no "el más reciente": si
    // alguien cambió de equipo, el periodo anterior debe liquidarse con el
    // equipo que tenía entonces (sus pesos y su curva), no con el de hoy.
    const period = await this.prisma.period.findUnique({
      where: { periodId },
      select: { startDate: true, endDate: true },
    });
    if (!period) return null;

    const employee = await this.prisma.employee.findUnique({
      where: { employeeId },
      select: {
        employeeId: true,
        baseSalary: true,
        teamAssignments: {
          where: {
            active: true,
            isPrimary: true,
            // La asignación se solapa con el periodo: empezó antes de que
            // terminara y no se cerró antes de que empezara.
            validFrom: { lte: period.endDate },
            OR: [{ validTo: null }, { validTo: { gte: period.startDate } }],
          },
          orderBy: { validFrom: 'desc' },
          take: 1,
          select: {
            team: {
              select: { teamId: true, teamCode: true, pays20Monthly: true },
            },
          },
        },
      },
    });
    if (!employee || employee.teamAssignments.length === 0) return null;

    const team = employee.teamAssignments[0].team;

    // Ventas agregadas por componente.
    const salesByComponent = await this.prisma.salesTransaction.groupBy({
      by: ['componentId'],
      where: { employeeId, periodId },
      _sum: { saleValue: true },
    });

    // Cuotas y pesos: se definen en el ciclo y el mes puede sobreescribirlos.
    // La precedencia es por empleado (cuotas) y por equipo (pesos), entera:
    // si el mes trae alguna fila, esa manda y el ciclo no aporta nada más.
    const [monthId] = parameterPeriodIds;

    const targetRows = await this.prisma.teamComponentTarget.findMany({
      where: { employeeId, periodId: { in: parameterPeriodIds } },
      select: { periodId: true, componentId: true, quotaValue: true },
    });
    const targets = preferMonthOverCycle(
      targetRows.filter((r) => r.periodId === monthId),
      targetRows.filter((r) => r.periodId !== monthId),
      () => employeeId,
    );

    const weightRows = await this.prisma.teamComponentWeight.findMany({
      where: { teamId: team.teamId, periodId: { in: parameterPeriodIds } },
      select: { periodId: true, componentId: true, weightPercent: true },
    });
    const weights = preferMonthOverCycle(
      weightRows.filter((r) => r.periodId === monthId),
      weightRows.filter((r) => r.periodId !== monthId),
      () => team.teamId,
    );

    const quotaByComp = new Map(
      targets.map((t) => [t.componentId, t.quotaValue]),
    );
    const saleByComp = new Map(
      salesByComponent.map((s) => [
        s.componentId,
        s._sum.saleValue ?? new Decimal(0),
      ]),
    );

    // Un renglón por componente con peso definido para el equipo.
    const components = weights.map((w) => ({
      componentId: w.componentId,
      weight: w.weightPercent,
      quota: quotaByComp.get(w.componentId) ?? new Decimal(0),
      sale: saleByComp.get(w.componentId) ?? new Decimal(0),
    }));

    // Excepción de pago garantizado.
    const condition = await this.prisma.employeePaymentCondition.findFirst({
      where: { employeeId, periodId },
      orderBy: { createdAt: 'desc' },
      select: { apply80Percent: true, apply20Percent: true },
    });

    // Cumplimiento del KPI del 20%, marcado por Nómina antes de calcular.
    const kpi = await this.prisma.employeeExecutionKpi.findUnique({
      where: { employeeId_periodId: { employeeId, periodId } },
      select: { meetsKpi: true },
    });

    return {
      employeeId,
      teamId: team.teamId,
      teamCode: team.teamCode,
      pays20Monthly: team.pays20Monthly,
      baseSalary: employee.baseSalary,
      components,
      guaranteedPay: condition
        ? { apply80: condition.apply80Percent, apply20: condition.apply20Percent }
        : null,
      // Sin marca = no cumple: nadie ha certificado el cumplimiento, y pagar de
      // menos se corrige recalculando (todo queda versionado) mientras que pagar
      // de más no. El pago garantizado del 20% sigue prevaleciendo sobre esto:
      // lo aplica el motor aparte, vía `guaranteedPay.apply20`.
      executionKpiResult: kpi?.meetsKpi ?? false,
    };
  }

  /**
   * Candidatos a la liquidación de un ciclo: quienes tienen alguna liquidación
   * en CUALQUIER mes del ciclo.
   *
   * No se buscan por ventas del ciclo porque un ciclo no tiene ventas propias.
   * Se excluyen los equipos que cobran el 20% mensual: ya cobraron mes a mes.
   */
  async cycleCandidates(monthIds: string[]): Promise<
    { employeeId: string; teamId: string; baseSalary: Decimal }[]
  > {
    if (monthIds.length === 0) return [];

    const headers = await this.prisma.incentiveCalculationHeader.findMany({
      where: {
        periodId: { in: monthIds },
        team: { pays20Monthly: false },
      },
      distinct: ['employeeId'],
      // El equipo y el salario del mes MÁS RECIENTE del ciclo: si alguien
      // cambió de equipo a mitad de ciclo, el cierre lo paga con el último.
      orderBy: [{ periodId: 'desc' }, { calculationVersion: 'desc' }],
      select: { employeeId: true, teamId: true, baseSalary: true },
    });
    return headers;
  }

  /**
   * Meses del ciclo con KPI cumplido, por empleado. Un solo `groupBy` en vez de
   * una consulta por persona.
   */
  async metMonthsByEmployee(
    monthIds: string[],
  ): Promise<Map<string, number>> {
    if (monthIds.length === 0) return new Map();

    const rows = await this.prisma.employeeExecutionKpi.groupBy({
      by: ['employeeId'],
      where: { periodId: { in: monthIds }, meetsKpi: true },
      _count: { _all: true },
    });
    return new Map(rows.map((r) => [r.employeeId, r._count._all]));
  }

  /**
   * Empleados con garantía del 20% en ALGÚN mes del ciclo.
   *
   * Se mira todo el ciclo, no solo el último mes: una garantía otorgada en
   * febrero se evaporaría al cierre si solo se consultara abril.
   */
  async guaranteed20InCycle(monthIds: string[]): Promise<Set<string>> {
    if (monthIds.length === 0) return new Set();

    const rows = await this.prisma.employeePaymentCondition.findMany({
      where: { periodId: { in: monthIds }, apply20Percent: true },
      distinct: ['employeeId'],
      select: { employeeId: true },
    });
    return new Set(rows.map((r) => r.employeeId));
  }

  /** Última versión de cálculo de un empleado en un periodo (0 si no hay). */
  async lastVersion(employeeId: string, periodId: string): Promise<number> {
    const last = await this.prisma.incentiveCalculationHeader.findFirst({
      where: { employeeId, periodId },
      orderBy: { calculationVersion: 'desc' },
      select: { calculationVersion: true },
    });
    return last?.calculationVersion ?? 0;
  }

  /**
   * Persiste una liquidación como NUEVA versión (nunca sobrescribe: USECASES §7)
   * con su detalle por componente, en una transacción.
   */
  async saveCalculation(
    employeeId: string,
    periodId: string,
    teamId: string,
    version: number,
    result: EmployeeCalculationResult,
    pays20Monthly: boolean,
  ): Promise<string> {
    const header = await this.prisma.incentiveCalculationHeader.create({
      data: {
        employeeId,
        periodId,
        teamId,
        calculationStatus: 'CALCULATED',
        baseSalary: result.baseSalary,
        component80Theoretical: result.component80Theoretical,
        component20Theoretical: result.component20Theoretical,
        component80Result: result.component80Result,
        component20Result: result.component20Result,
        totalIncentive: result.totalIncentive,
        guaranteedPayApplied: result.guaranteedPayApplied,
        executionKpiResult: result.executionKpiResult,
        execution20Mode: result.execution20Mode,
        executionPayMonthly: pays20Monthly,
        // Bolsas del 20% realmente pagadas por esta liquidación: 0 en un mes
        // que solo devenga, N en el cierre del ciclo.
        executionCycleMultiplier: result.executionCycleMultiplier,
        calculationVersion: version,
        details: {
          create: result.details.map((d) => ({
            componentId: d.componentId,
            quotaValue: d.quotaValue,
            saleValue: d.saleValue,
            compliancePercent: d.compliancePercent,
            curvePayPercent: d.curvePayPercent,
            weightedComponentPercent: d.weightedComponentPercent,
            componentIncentiveValue: d.componentIncentiveValue,
          })),
        },
      },
      select: { incentiveCalculationHeaderId: true },
    });
    return header.incentiveCalculationHeaderId;
  }
}

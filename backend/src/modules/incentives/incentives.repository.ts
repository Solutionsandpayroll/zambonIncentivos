import { Injectable } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../shared/database/prisma.service';
import { EmployeeCalculationResult } from './domain/calculation-engine';

/** Insumos crudos de un empleado para un periodo, ya agregados. */
export interface EmployeeInputs {
  employeeId: string;
  teamId: string;
  teamCode: string | null;
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

  /** Escalones de la curva de pago del periodo (global, componentId = null). */
  async loadCurveSteps(periodId: string) {
    return this.prisma.curvePay.findMany({
      where: { periodId, active: true },
      select: {
        componentId: true,
        minCompliancePercent: true,
        payPercent: true,
        isCeiling: true,
      },
      orderBy: { minCompliancePercent: 'asc' },
    });
  }

  /**
   * Reúne todos los insumos de un empleado para el periodo: equipo vigente,
   * salario base, ventas agregadas por componente, cuotas, pesos del equipo,
   * KPI de ejecución y excepción de pago garantizado.
   */
  async loadEmployeeInputs(
    employeeId: string,
    periodId: string,
  ): Promise<EmployeeInputs | null> {
    const employee = await this.prisma.employee.findUnique({
      where: { employeeId },
      select: {
        employeeId: true,
        baseSalary: true,
        teamAssignments: {
          where: { active: true, isPrimary: true },
          orderBy: { validFrom: 'desc' },
          take: 1,
          select: { team: { select: { teamId: true, teamCode: true } } },
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

    // Cuotas del empleado en el periodo.
    const targets = await this.prisma.teamComponentTarget.findMany({
      where: { employeeId, periodId },
      select: { componentId: true, quotaValue: true },
    });

    // Pesos del equipo en el periodo.
    const weights = await this.prisma.teamComponentWeight.findMany({
      where: { teamId: team.teamId, periodId },
      select: { componentId: true, weightPercent: true },
    });

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

    return {
      employeeId,
      teamId: team.teamId,
      teamCode: team.teamCode,
      baseSalary: employee.baseSalary,
      components,
      guaranteedPay: condition
        ? { apply80: condition.apply80Percent, apply20: condition.apply20Percent }
        : null,
      // KPI de ejecución: sin subsistema de KPIs aún, se asume cumplido cuando
      // hay pago garantizado del 20%; por defecto false. Punto de extensión.
      executionKpiResult: condition?.apply20Percent ?? false,
    };
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
    cycleMultiplier: number,
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
        executionPayMonthly: cycleMultiplier === 1,
        executionCycleMultiplier: cycleMultiplier,
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

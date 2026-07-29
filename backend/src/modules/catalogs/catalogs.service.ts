import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../shared/database/prisma.service';
import { AuditAction, AuditService } from '../../shared/audit/audit.service';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { CreatePeriodDto } from './dto/create-period.dto';
import { CreateComponentDto } from './dto/create-component.dto';
import { SetComponentWeightsDto } from './dto/component-weights.dto';
import { SetCurvePayDto } from './dto/curve-pay.dto';
import { SetTargetsDto } from './dto/targets.dto';

/** Tolerancia al comparar la suma de pesos con 1.0 (evita ruido de coma flotante). */
const WEIGHT_SUM_TOLERANCE = new Decimal('0.000001');

@Injectable()
export class CatalogsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ---- Periodos -----------------------------------------------------------
  listPeriods() {
    return this.prisma.period.findMany({
      orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }],
    });
  }

  createPeriod(dto: CreatePeriodDto) {
    return this.prisma.period.create({
      data: {
        periodYear: dto.periodYear,
        periodMonth: dto.periodMonth,
        periodType: dto.periodType ?? 'MONTH',
        cycleNumber: dto.cycleNumber ?? null,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
      },
    });
  }

  async closePeriod(periodId: string, user?: AuthenticatedUser) {
    const period = await this.prisma.period.findUnique({ where: { periodId } });
    if (!period) throw new NotFoundException('El periodo no existe');

    const updated = await this.prisma.period.update({
      where: { periodId },
      data: { isClosed: true },
    });

    await this.audit.record({
      userId: user?.userId ?? null,
      username: user?.username ?? null,
      action: AuditAction.PERIOD_CLOSE,
      entityType: 'period',
      entityId: periodId,
      periodId,
      metadata: {
        periodYear: period.periodYear,
        periodMonth: period.periodMonth,
      },
    });

    return updated;
  }

  // ---- Componentes --------------------------------------------------------
  listComponents() {
    return this.prisma.salesComponent.findMany({ where: { active: true } });
  }

  createComponent(dto: CreateComponentDto) {
    return this.prisma.salesComponent.create({ data: { ...dto } });
  }

  // ---- Pesos de componentes ----------------------------------------------
  /**
   * Pesos de un equipo en un periodo, con el componente incluido: la UI los usa
   * para saber qué productos mide ese equipo, no el catálogo global.
   */
  getComponentWeights(teamId: string, periodId: string) {
    return this.prisma.teamComponentWeight.findMany({
      where: { teamId, periodId },
      include: { component: true },
      orderBy: { weightPercent: 'desc' },
    });
  }

  /**
   * Define/actualiza (batch) los pesos de un equipo en un periodo.
   * Regla dura (USECASES §2.2): los pesos deben sumar 1.0 → 422 si no.
   * Reemplaza los pesos existentes del equipo/periodo en una transacción.
   */
  async setComponentWeights(dto: SetComponentWeightsDto) {
    const period = await this.prisma.period.findUnique({
      where: { periodId: dto.periodId },
    });
    if (!period) throw new NotFoundException('El periodo no existe');
    if (period.isClosed) {
      throw new UnprocessableEntityException(
        'El periodo está cerrado; no se editan parámetros',
      );
    }

    const sum = dto.weights.reduce(
      (acc, w) => acc.add(new Decimal(w.weightPercent)),
      new Decimal(0),
    );
    if (sum.minus(1).abs().greaterThan(WEIGHT_SUM_TOLERANCE)) {
      throw new UnprocessableEntityException(
        `Los pesos deben sumar 1.0 (suma actual: ${sum.toString()})`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.teamComponentWeight.deleteMany({
        where: { teamId: dto.teamId, periodId: dto.periodId },
      });
      await tx.teamComponentWeight.createMany({
        data: dto.weights.map((w) => ({
          teamId: dto.teamId,
          periodId: dto.periodId,
          componentId: w.componentId,
          weightPercent: new Decimal(w.weightPercent),
        })),
      });
      return tx.teamComponentWeight.findMany({
        where: { teamId: dto.teamId, periodId: dto.periodId },
      });
    });
  }

  // ---- Curva de pago ------------------------------------------------------
  /** Curva vigente del periodo (filtro opcional por componente). */
  getCurvePay(periodId: string, componentId?: string) {
    return this.prisma.curvePay.findMany({
      where: {
        periodId,
        active: true,
        ...(componentId !== undefined ? { componentId } : {}),
      },
      orderBy: { minCompliancePercent: 'asc' },
    });
  }

  /**
   * Carga (batch) la curva de pago de un periodo: reemplaza los escalones
   * existentes para ese (periodo, componente) en una transacción.
   *
   * Reglas (schema.prisma + calculocomisiones.xlsx · pestaña "Curve Pay"):
   *  - Los escalones se guardan ordenados por umbral de cumplimiento.
   *  - `isCeiling` marca el tope superior (fila ">120%").
   *  - `componentId = null` → la curva aplica a todos los componentes.
   */
  async setCurvePay(dto: SetCurvePayDto) {
    const period = await this.prisma.period.findUnique({
      where: { periodId: dto.periodId },
    });
    if (!period) throw new NotFoundException('El periodo no existe');
    if (period.isClosed) {
      throw new UnprocessableEntityException(
        'El periodo está cerrado; no se editan parámetros',
      );
    }

    // Validación: al menos un umbral y sin umbrales repetidos.
    const seen = new Set<string>();
    for (const s of dto.steps) {
      const key = new Decimal(s.minCompliancePercent).toString();
      if (seen.has(key)) {
        throw new UnprocessableEntityException(
          `Umbral de cumplimiento repetido: ${key}`,
        );
      }
      seen.add(key);
    }

    const componentId = dto.componentId ?? null;

    return this.prisma.$transaction(async (tx) => {
      await tx.curvePay.deleteMany({
        where: { periodId: dto.periodId, componentId },
      });
      await tx.curvePay.createMany({
        data: dto.steps.map((s) => ({
          periodId: dto.periodId,
          componentId,
          minCompliancePercent: new Decimal(s.minCompliancePercent),
          payPercent: new Decimal(s.payPercent),
          isCeiling: s.isCeiling ?? false,
        })),
      });
      return tx.curvePay.findMany({
        where: { periodId: dto.periodId, componentId },
        orderBy: { minCompliancePercent: 'asc' },
      });
    });
  }

  // ---- Cuotas (targets) ---------------------------------------------------
  /** Cuotas de un periodo (filtro opcional por empleado). */
  getTargets(periodId: string, employeeId?: string) {
    return this.prisma.teamComponentTarget.findMany({
      where: { periodId, ...(employeeId ? { employeeId } : {}) },
    });
  }

  /**
   * Upsert (batch) de cuotas por (empleado, componente, periodo). Reemplaza el
   * valor si ya existía. Mismo comportamiento que la importación del archivo de
   * ventas, pero por vía manual desde Admin (USECASES §2.2).
   */
  async setTargets(dto: SetTargetsDto) {
    const period = await this.prisma.period.findUnique({
      where: { periodId: dto.periodId },
    });
    if (!period) throw new NotFoundException('El periodo no existe');
    if (period.isClosed) {
      throw new UnprocessableEntityException(
        'El periodo está cerrado; no se editan parámetros',
      );
    }

    await this.prisma.$transaction(
      dto.targets.map((t) =>
        this.prisma.teamComponentTarget.upsert({
          where: {
            employeeId_componentId_periodId: {
              employeeId: t.employeeId,
              componentId: t.componentId,
              periodId: dto.periodId,
            },
          },
          create: {
            employeeId: t.employeeId,
            componentId: t.componentId,
            periodId: dto.periodId,
            quotaValue: new Decimal(t.quotaValue),
          },
          update: { quotaValue: new Decimal(t.quotaValue) },
        }),
      ),
    );

    return this.getTargets(dto.periodId);
  }
}

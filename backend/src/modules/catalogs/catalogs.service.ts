import {
  ConflictException,
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
import {
  buildYearCalendar,
  cycleBounds,
  cycleNumberForMonth,
  CYCLES_PER_YEAR,
  periodLabel,
} from './domain/period-calendar';
import { PeriodResolverService } from '../../shared/periods/period-resolver.service';
import { preferMonthOverCycleTagged } from '../../shared/periods/parameter-precedence';

/** Tolerancia al comparar la suma de pesos con 1.0 (evita ruido de coma flotante). */
const WEIGHT_SUM_TOLERANCE = new Decimal('0.000001');

@Injectable()
export class CatalogsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly periods: PeriodResolverService,
  ) {}

  // ---- Periodos -----------------------------------------------------------
  listPeriods() {
    return this.prisma.period.findMany({
      orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }],
    });
  }

  async createPeriod(dto: CreatePeriodDto) {
    const periodType = dto.periodType ?? 'MONTH';
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (endDate < startDate) {
      throw new UnprocessableEntityException(
        'La fecha de fin no puede ser anterior a la de inicio',
      );
    }

    if (periodType === 'CYCLE') {
      // Un ciclo son exactamente 4 meses; si se admite otro lapso, la
      // liquidación acumulada del 20% deja de tener un denominador claro.
      if (!dto.cycleNumber || dto.cycleNumber < 1 || dto.cycleNumber > CYCLES_PER_YEAR) {
        throw new UnprocessableEntityException(
          `Un ciclo requiere cycleNumber entre 1 y ${CYCLES_PER_YEAR}`,
        );
      }
      const [expectedStart, expectedEnd] = cycleBounds(dto.periodYear, dto.cycleNumber);
      if (
        startDate.getTime() !== expectedStart.getTime() ||
        endDate.getTime() !== expectedEnd.getTime()
      ) {
        throw new UnprocessableEntityException(
          `El ciclo ${dto.cycleNumber} de ${dto.periodYear} debe ir de ` +
            `${expectedStart.toISOString().slice(0, 10)} a ${expectedEnd.toISOString().slice(0, 10)}`,
        );
      }
      if (dto.parentPeriodId) {
        throw new UnprocessableEntityException('Un ciclo no puede tener periodo padre');
      }
    } else if (dto.cycleNumber) {
      throw new UnprocessableEntityException(
        'cycleNumber solo aplica a periodos de tipo CYCLE',
      );
    }

    // El padre debe ser el ciclo que realmente contiene a ese mes.
    if (dto.parentPeriodId) {
      const parent = await this.prisma.period.findUnique({
        where: { periodId: dto.parentPeriodId },
      });
      if (!parent) throw new NotFoundException('El periodo padre no existe');
      if (parent.periodType !== 'CYCLE') {
        throw new UnprocessableEntityException('El periodo padre debe ser un ciclo');
      }
      if (
        parent.periodYear !== dto.periodYear ||
        parent.cycleNumber !== cycleNumberForMonth(dto.periodMonth)
      ) {
        throw new UnprocessableEntityException(
          `El mes ${dto.periodMonth} pertenece al ciclo ` +
            `${cycleNumberForMonth(dto.periodMonth)}, no al indicado`,
        );
      }
    }

    try {
      return await this.prisma.period.create({
        data: {
          periodYear: dto.periodYear,
          periodMonth: dto.periodMonth,
          periodType,
          cycleNumber: dto.cycleNumber ?? null,
          parentPeriodId: dto.parentPeriodId ?? null,
          startDate,
          endDate,
        },
      });
    } catch (e) {
      // P2002 = choque con @@unique([periodYear, periodMonth, periodType]).
      // Sin esto sale un 500 opaco.
      if ((e as { code?: string }).code === 'P2002') {
        throw new ConflictException('Ya existe un periodo con ese año, mes y tipo');
      }
      throw e;
    }
  }

  /**
   * Crea el año completo: 3 ciclos y 12 meses, con los meses enlazados a su
   * ciclo. Idempotente: lo que ya existe no se toca, y a un mes existente solo
   * se le pone el padre si no lo tenía — re-vincular movería los parámetros
   * bajo un periodo que quizá ya se liquidó.
   */
  async seedYear(periodYear: number, user?: AuthenticatedUser) {
    const specs = buildYearCalendar(periodYear);
    const existing = await this.prisma.period.findMany({ where: { periodYear } });
    const keyOf = (p: { periodMonth: number; periodType: string }) =>
      `${p.periodMonth}|${p.periodType}`;
    const byKey = new Map(existing.map((p) => [keyOf(p), p]));

    const created: string[] = [];
    const linked: string[] = [];
    const skipped: string[] = [];

    // Los ciclos primero: los meses necesitan su id para enlazarse.
    const cycleIdByNumber = new Map<number, string>();
    for (const spec of specs.filter((s) => s.periodType === 'CYCLE')) {
      const found = byKey.get(keyOf(spec));
      if (found) {
        cycleIdByNumber.set(spec.cycleNumber!, found.periodId);
        skipped.push(periodLabel(spec));
        continue;
      }
      const row = await this.prisma.period.create({
        data: {
          periodYear: spec.periodYear,
          periodMonth: spec.periodMonth,
          periodType: 'CYCLE',
          cycleNumber: spec.cycleNumber,
          startDate: spec.startDate,
          endDate: spec.endDate,
        },
      });
      cycleIdByNumber.set(spec.cycleNumber!, row.periodId);
      created.push(periodLabel(spec));
    }

    for (const spec of specs.filter((s) => s.periodType === 'MONTH')) {
      const parentPeriodId = cycleIdByNumber.get(spec.parentCycleNumber!) ?? null;
      const found = byKey.get(keyOf(spec));

      if (!found) {
        await this.prisma.period.create({
          data: {
            periodYear: spec.periodYear,
            periodMonth: spec.periodMonth,
            periodType: 'MONTH',
            cycleNumber: null,
            parentPeriodId,
            startDate: spec.startDate,
            endDate: spec.endDate,
          },
        });
        created.push(periodLabel(spec));
        continue;
      }

      if (!found.parentPeriodId && parentPeriodId) {
        await this.prisma.period.update({
          where: { periodId: found.periodId },
          data: { parentPeriodId },
        });
        linked.push(periodLabel(spec));
      } else {
        skipped.push(periodLabel(spec));
      }
    }

    await this.audit.record({
      userId: user?.userId ?? null,
      username: user?.username ?? null,
      action: AuditAction.PERIOD_SEED_YEAR,
      entityType: 'period',
      metadata: { periodYear, created: created.length, linked: linked.length },
    });

    return { periodYear, created, linked, skipped };
  }

  async closePeriod(periodId: string, user?: AuthenticatedUser) {
    const period = await this.prisma.period.findUnique({ where: { periodId } });
    if (!period) throw new NotFoundException('El periodo no existe');

    // Cerrar un ciclo sin haberlo liquidado dejaría el 20% devengado de cuatro
    // meses sin pagar y sin forma de pagarlo: `calculateCycle` rechaza los
    // ciclos cerrados.
    if (period.periodType === 'CYCLE') {
      const payouts = await this.prisma.incentiveCalculationHeader.count({
        where: { periodId },
      });
      if (payouts === 0) {
        // Se nombra dónde se hace, porque ya no está en esta pantalla: la
        // liquidación del 20% es el último paso del asistente de Cálculo, sobre
        // el mes que cierra el ciclo.
        throw new ConflictException(
          'El ciclo no tiene liquidación calculada: liquide el 20% desde ' +
            'Cálculo (último paso, al calcular el mes que cierra el ciclo) ' +
            'antes de cerrarlo',
        );
      }
    }

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
  /**
   * Pesos de un equipo en un periodo. `teamId` es opcional: sin él devuelve los
   * de TODOS los equipos, que es lo que necesita la vista de cobertura para
   * mostrar de un vistazo qué equipos están sin pesos o no suman 1.0.
   */
  async getComponentWeights(teamId: string | undefined, periodId: string) {
    const ids = await this.periods.resolveParameterPeriodIds(periodId);
    const rows = await this.prisma.teamComponentWeight.findMany({
      where: { periodId: { in: ids }, ...(teamId ? { teamId } : {}) },
      include: { component: true },
      orderBy: { weightPercent: 'desc' },
    });

    // `source` deja ver en pantalla qué está heredado del ciclo y qué es una
    // excepción propia del mes.
    const [monthId] = ids;
    return preferMonthOverCycleTagged(
      rows.filter((r) => r.periodId === monthId),
      rows.filter((r) => r.periodId !== monthId),
      (r) => r.teamId,
    );
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
  async getCurvePay(periodId: string, componentId?: string) {
    const ids = await this.periods.resolveParameterPeriodIds(periodId);
    const rows = await this.prisma.curvePay.findMany({
      where: {
        periodId: { in: ids },
        active: true,
        ...(componentId !== undefined ? { componentId } : {}),
      },
      orderBy: { minCompliancePercent: 'asc' },
    });

    const [monthId] = ids;
    return preferMonthOverCycleTagged(
      rows.filter((r) => r.periodId === monthId),
      rows.filter((r) => r.periodId !== monthId),
      (r) => r.componentId ?? 'GLOBAL',
    );
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
  async getTargets(periodId: string, employeeId?: string) {
    const ids = await this.periods.resolveParameterPeriodIds(periodId);
    const rows = await this.prisma.teamComponentTarget.findMany({
      where: { periodId: { in: ids }, ...(employeeId ? { employeeId } : {}) },
    });

    // Precedencia por empleado: si el mes trae cuotas suyas, esas mandan.
    const [monthId] = ids;
    return preferMonthOverCycleTagged(
      rows.filter((r) => r.periodId === monthId),
      rows.filter((r) => r.periodId !== monthId),
      (r) => r.employeeId,
    );
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

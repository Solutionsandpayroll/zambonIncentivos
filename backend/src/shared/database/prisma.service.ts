import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Cliente Prisma como servicio de NestJS. Es la única puerta de acceso a la
 * base de datos (fuente de verdad). Se conecta al arrancar y cierra al destruir.
 *
 * El schema vive en ../../prisma/schema.prisma (raíz del proyecto); el cliente
 * se genera con `prisma generate --schema=../prisma/schema.prisma`.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Conexión a PostgreSQL establecida');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}

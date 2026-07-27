import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { APP_GUARD } from '@nestjs/core';
import { join } from 'path';
import configuration from './config/configuration';
import { AppRootController } from './modules/app-root.controller';
import { PrismaModule } from './shared/database/prisma.module';
import { AuditModule } from './shared/audit/audit.module';
import { CommonModule } from './common/common.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { CatalogsModule } from './modules/catalogs/catalogs.module';
import { SalesImportModule } from './modules/sales-import/sales-import.module';
import { IncentivesModule } from './modules/incentives/incentives.module';
import { ResultsModule } from './modules/results/results.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AdminModule } from './modules/admin/admin.module';
import { HomeModule } from './modules/home/home.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      // Busca el .env de backend/ y, como respaldo, el de la raíz del proyecto.
      envFilePath: ['.env', '../.env'],
    }),
    // Sirve el frontend estático desde la raíz del proyecto (mismo origen que la
    // API → sin CORS). La API cuelga de /api/v1 y queda excluida de este handler.
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..'),
      serveRoot: '/',
      exclude: ['/api/v1/{*path}'],
      serveStaticOptions: { index: false },
    }),
    PrismaModule,
    AuditModule,
    CommonModule,
    AuthModule,
    UsersModule,
    OrganizationModule,
    CatalogsModule,
    SalesImportModule,
    IncentivesModule,
    ResultsModule,
    ReportsModule,
    AdminModule,
    HomeModule,
  ],
  controllers: [AppRootController],
  providers: [
    // Autenticación obligatoria por defecto (salvo @Public); luego RBAC.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}

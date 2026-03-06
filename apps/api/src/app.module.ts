import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CasesModule } from './cases/cases.module';
import { SurchargesModule } from './surcharges/surcharges.module';
import { BillingModule } from './billing/billing.module';
import { ImportsModule } from './imports/imports.module';
import { AuditModule } from './audit/audit.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { InsurersModule } from './insurers/insurers.module';
import { RolesModule } from './roles/roles.module';
import { CustomersModule } from './customers/customers.module';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { HealthModule } from './health/health.module';
import { AppController } from './app.controller';

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 10,
      },
      {
        name: 'medium',
        ttl: 60000,
        limit: 100,
      },
      {
        name: 'long',
        ttl: 900000,
        limit: 1000,
      },
    ]),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined,
      },
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    CustomersModule,
    CasesModule,
    SurchargesModule,
    BillingModule,
    ImportsModule,
    AuditModule,
    DashboardModule,
    RolesModule,
    InsurersModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}

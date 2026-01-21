import { MailModule } from '@common/modules';
import { AuditLogSubscriber } from '@common/subscriber';
import { SYSTEM_RESOURCE, VERSIONING_API } from '@constants';
import { AuditLogModule } from '@features/audit-log';
import { ContentModule } from '@features/content';
import { PolicyModule } from '@features/policy';
import { RedisModule } from '@features/redis';
import { ResourceModule } from '@features/resources';
import { RoleModule } from '@features/roles';
import { TeamModule } from '@features/teams';
import { Team } from '@features/teams/entities/team.entity';
import { UserAuthModule } from '@features/user-auth';
import { UserInviteModule, UserModule } from '@features/users';
import { UserTeamModule } from '@features/users/user-team';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';
import { ClsModule } from 'nestjs-cls';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Environment } from './config';
import { ContextMiddleware, RequestMiddleware } from './middleware';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [`${__dirname}/**/*.entity.ts`],
      autoLoadEntities: true,
      synchronize: false,
      logging: process.env.NODE_ENV !== Environment.production,
      useUTC: true,
      ssl: {
        rejectUnauthorized: true,
        ca: process.env.DATABASE_CA_CERT,
      },
    }),
    TypeOrmModule.forFeature([Team]),
    SentryModule.forRoot(),
    MailerModule.forRoot({
      transport: {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: true,
        tls: {
          rejectUnauthorized: false,
        },
        auth: {
          user: process.env.MAIL_USERNAME,
          pass: process.env.MAIL_PASSWORD,
        },
      },
      template: {
        dir: join(__dirname, 'common/modules/mail/templates'),
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
    }),
    ClsModule.forRoot({
      global: true, // Makes it available globally without extra imports
      middleware: {
        mount: true, // Use this to mount middleware for handling requests
      },
    }),
    EventEmitterModule.forRoot(),
    RedisModule,
    ResourceModule,
    RoleModule,
    TeamModule,
    UserModule,
    UserAuthModule,
    PolicyModule,
    UserTeamModule,
    ContentModule,
    MailModule,
    UserInviteModule,
    AuditLogModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
    AppService,
    AuditLogSubscriber,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestMiddleware)
      .forRoutes('*')
      .apply(ContextMiddleware)
      .exclude(
        {
          path: 'user-auth/(.*)',
          method: RequestMethod.POST,
          version: VERSIONING_API.v1,
        },
        {
          path: `${SYSTEM_RESOURCE.user}/me`,
          method: RequestMethod.GET,
          version: VERSIONING_API.v1,
        },
        {
          path: SYSTEM_RESOURCE.team,
          method: RequestMethod.GET,
          version: VERSIONING_API.v1,
        },
        {
          path: SYSTEM_RESOURCE.team,
          method: RequestMethod.POST,
          version: VERSIONING_API.v1,
        },
        {
          path: SYSTEM_RESOURCE.policy,
          method: RequestMethod.GET,
          version: VERSIONING_API.v1,
        },
        {
          path: 'app/(.*)',
          method: RequestMethod.ALL,
          version: VERSIONING_API.v1,
        },
      )
      .forRoutes('*');
  }
}

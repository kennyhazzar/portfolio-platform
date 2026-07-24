import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';

import { LoggerModuleOptions, BullmqModuleOptions, ThrottlerOptions } from './options';

import { DrizzleModule } from './common/drizzle';
import { CryptoModule } from './common/crypto/crypto.module';
import { UsersModule } from './modules/users/users.module';
import { MigrationModule } from './modules/migration/migration.module';
import { FileModule } from './modules/file/file.module';
import { NotificationModule } from './modules/notification/notification.module';
import { HealthModule } from './modules/health/health.module';
import { MailModule } from './modules/mail/mail.module';
import { AdminModule } from './modules/admin/admin.module';
import { CaptchaModule } from './modules/captcha/captcha.module';
import { HeroModule } from './modules/hero/hero.module';
import { AboutModule } from './modules/about/about.module';
import { SiteSettingModule } from './modules/site-setting/site-setting.module';
import { TechnologyModule } from './modules/technology/technology.module';
import { NavigationModule } from './modules/navigation/navigation.module';
import { CaseModule } from './modules/case/case.module';
import { PostModule } from './modules/post/post.module';
import { ContactModule } from './modules/contact/contact.module';
import { CommentModule } from './modules/comment/comment.module';
import { I18nModule } from './i18n';
import { loadConfiguration } from './config/configuration';
import { CsrfGuard } from './guards/csrf.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env', 'docker/.env'],
      load: [loadConfiguration],
    }),
    LoggerModule.forRootAsync({ useFactory: LoggerModuleOptions, inject: [ConfigService] }),

    I18nModule,

    DrizzleModule,

    CryptoModule,

    BullModule.forRootAsync({ useFactory: BullmqModuleOptions, inject: [ConfigService] }),

    ScheduleModule.forRoot(),

    ThrottlerModule.forRootAsync({ useFactory: ThrottlerOptions, inject: [ConfigService] }),

    UsersModule,

    FileModule,

    NotificationModule,

    HealthModule,

    MigrationModule,

    MailModule,

    AdminModule,

    CaptchaModule,

    HeroModule,

    AboutModule,

    SiteSettingModule,

    TechnologyModule,

    NavigationModule,

    CaseModule,

    PostModule,

    ContactModule,

    CommentModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: CsrfGuard,
    },
  ],
})
export class AppModule {}

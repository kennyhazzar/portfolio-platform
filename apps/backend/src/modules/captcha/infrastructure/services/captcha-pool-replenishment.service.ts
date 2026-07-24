import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CommandBus } from '@nestjs/cqrs';
import { CaptchaRepository } from '../../domain/repositories/captcha.repository';
import { CaptchaPoolPort } from '../../application/ports/captcha.ports';
import { EnqueueCaptchaGenerationBatchCommand } from '../../application/commands/captcha.commands';
import { CaptchaDifficulty, CaptchaTemplateStatus } from '../../domain/captcha.types';

const POOL_LOW_WATERMARK = 20;
const POOL_TOP_UP_COUNT = 50;
const DIFFICULTIES = [CaptchaDifficulty.EASY, CaptchaDifficulty.MEDIUM, CaptchaDifficulty.HARD];

/**
 * Nothing else keeps the Redis asset pool topped up — without this, every active template's
 * pool eventually drains to zero (each solved/expired challenge consumes one asset) and every
 * subsequent challenge request 404s with captcha.template.notFound until an admin manually
 * calls the generate-batch endpoint. Runs once at boot (so a fresh deploy isn't stuck waiting
 * for the first tick) and then on a fixed schedule.
 *
 * Hooks into onApplicationBootstrap, not onModuleInit — CqrsModule registers command handlers
 * with the CommandBus during onApplicationBootstrap, which runs *after* every module's
 * onModuleInit. Calling commandBus.execute() from onModuleInit throws
 * CommandHandlerNotFoundException since the handler map isn't populated yet.
 */
@Injectable()
export class CaptchaPoolReplenishmentService implements OnApplicationBootstrap {
  private readonly logger = new Logger(CaptchaPoolReplenishmentService.name);

  constructor(
    private readonly captchaRepository: CaptchaRepository,
    private readonly pool: CaptchaPoolPort,
    private readonly commandBus: CommandBus,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.replenish();
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async replenish(): Promise<void> {
    const templates = await this.captchaRepository.listTemplates();

    for (const template of templates) {
      if (template.status !== CaptchaTemplateStatus.ACTIVE) continue;

      const activeConfig = await this.captchaRepository.findActiveConfig(template.id);
      if (!activeConfig) continue;

      for (const difficulty of DIFFICULTIES) {
        const size = await this.pool.getPoolSize(template.code, difficulty);
        if (size >= POOL_LOW_WATERMARK) continue;

        this.logger.log(
          `Pool low for template=${template.code} difficulty=${difficulty} size=${size} — topping up ${POOL_TOP_UP_COUNT}`,
        );
        await this.commandBus.execute(
          new EnqueueCaptchaGenerationBatchCommand(activeConfig.id, POOL_TOP_UP_COUNT, difficulty),
        );
      }
    }
  }
}

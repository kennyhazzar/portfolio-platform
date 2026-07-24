import { Injectable, Logger } from '@nestjs/common';
import { CaptchaRepository } from '@/modules/captcha/domain/repositories/captcha.repository';
import {
  CaptchaDifficulty,
  CaptchaTemplateStatus,
  DEFAULT_CAPTCHA_TEMPLATE_CODE,
} from '@/modules/captcha/domain/captcha.types';

/**
 * Seeds the default captcha template + an active config so the public comment form's captcha
 * flow works out of the box — without this, every challenge request 404s with
 * captcha.template.notFound since template/config creation otherwise only happens through the
 * admin panel (which nobody has driven yet on a fresh install).
 */
@Injectable()
export class CaptchaTemplateSeedService {
  private readonly logger = new Logger(CaptchaTemplateSeedService.name);

  constructor(private readonly captchaRepository: CaptchaRepository) {}

  async seedIfEmpty(): Promise<void> {
    const existing = await this.captchaRepository.findTemplateByCode(DEFAULT_CAPTCHA_TEMPLATE_CODE);
    if (existing) return;

    const template = await this.captchaRepository.createTemplate({
      code: DEFAULT_CAPTCHA_TEMPLATE_CODE,
      name: 'Default SVG text captcha',
      type: 'image_text',
      status: CaptchaTemplateStatus.ACTIVE,
      defaultDifficulty: CaptchaDifficulty.MEDIUM,
      generator: 'svg_text',
    });

    const version = await this.captchaRepository.nextConfigVersion(template.id);
    const config = await this.captchaRepository.createConfig({
      templateId: template.id,
      version,
      configJson: { width: 320, height: 100, length: 6 },
    });
    await this.captchaRepository.activateConfig(config.id);

    this.logger.log(`Seeded default captcha template "${DEFAULT_CAPTCHA_TEMPLATE_CODE}" with an active config`);
  }
}

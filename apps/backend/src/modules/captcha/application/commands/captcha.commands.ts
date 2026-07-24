import { Command } from '@nestjs/cqrs';

import {
  CaptchaChallengeContext,
  CaptchaConfig,
  CaptchaDifficulty,
  CaptchaTemplate,
  CaptchaTemplateStatus,
} from '../../domain/captcha.types';

export class CreateCaptchaTemplateCommand extends Command<CaptchaTemplate> {
  constructor(
    public readonly input: {
      code: string;
      name: string;
      type?: 'image_text' | 'math_expression';
      status?: CaptchaTemplateStatus;
      defaultDifficulty?: CaptchaDifficulty;
      generator?: string;
    },
  ) {
    super();
  }
}

export class CreateCaptchaConfigDraftCommand extends Command<CaptchaConfig> {
  constructor(
    public readonly templateId: string,
    public readonly configJson: Record<string, unknown>,
    public readonly createdByUserId?: string | null,
  ) {
    super();
  }
}

export class ActivateCaptchaConfigCommand extends Command<CaptchaConfig> {
  constructor(public readonly configId: string) {
    super();
  }
}

export class GenerateCaptchaPreviewCommand extends Command<
  Array<{ contentType: string; imageBase64: string; metadata: Record<string, unknown> }>
> {
  constructor(
    public readonly configId: string,
    public readonly count: number,
    public readonly difficulty?: CaptchaDifficulty,
  ) {
    super();
  }
}

export class EnqueueCaptchaGenerationBatchCommand extends Command<{
  queued: boolean;
  count: number;
  difficulty: CaptchaDifficulty;
}> {
  constructor(
    public readonly configId: string,
    public readonly count: number,
    public readonly difficulty: CaptchaDifficulty,
  ) {
    super();
  }
}

export class CreateCaptchaChallengeCommand extends Command<{
  challengeId: string;
  imageUrl: string;
  expiresIn: number;
}> {
  constructor(
    public readonly input: {
      context: CaptchaChallengeContext;
      riskScore?: number;
      difficulty?: CaptchaDifficulty;
      templateCode?: string;
      subject?: string | null;
    },
  ) {
    super();
  }
}

export class VerifyCaptchaChallengeCommand extends Command<{ success: boolean; attemptsLeft: number }> {
  constructor(
    public readonly challengeId: string,
    public readonly answer: string,
    public readonly meta: { ip?: string | null; userAgent?: string | null },
  ) {
    super();
  }
}

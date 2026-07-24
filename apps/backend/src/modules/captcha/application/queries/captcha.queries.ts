import { Query } from '@nestjs/cqrs';

import { CaptchaConfig, CaptchaDifficulty, CaptchaTemplate } from '../../domain/captcha.types';

export class GetCaptchaTemplatesQuery extends Query<CaptchaTemplate[]> {
  constructor() {
    super();
  }
}

export class GetCaptchaConfigHistoryQuery extends Query<CaptchaConfig[]> {
  constructor(public readonly templateId: string) {
    super();
  }
}

export class GetCaptchaImageQuery extends Query<{ stream: NodeJS.ReadableStream; contentType?: string }> {
  constructor(public readonly challengeId: string) {
    super();
  }
}

export class GetCaptchaPoolsQuery extends Query<
  Array<{ templateCode: string; difficulty: CaptchaDifficulty; size: number }>
> {
  constructor() {
    super();
  }
}

export class GetCaptchaMetricsQuery extends Query<{
  assets: Array<{ status: string; difficulty: string; count: number }>;
  challenges: { total: number; passed: number; failed: number; pending: number };
}> {
  constructor() {
    super();
  }
}

export class GetCaptchaPoolSizeQuery extends Query<number> {
  constructor(
    public readonly templateCode: string,
    public readonly difficulty: CaptchaDifficulty,
  ) {
    super();
  }
}

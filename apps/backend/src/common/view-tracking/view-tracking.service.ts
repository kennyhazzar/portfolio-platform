import Redis from 'ioredis';
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const KEY_PREFIX = 'view-tracking';
const DEDUP_WINDOW_SECONDS = 30 * 60;

/**
 * Per-visitor view dedup for Case/Post view counters (docs/planning/02-content-model.md §9).
 * A Redis SET NX with a TTL acts as the "already counted this visitor" marker — no dedicated
 * table needed since losing this state on Redis restart only means a visitor's view might be
 * re-counted, which is an acceptable failure mode for a simple analytics counter.
 */
@Injectable()
export class ViewTrackingService implements OnModuleDestroy {
  private readonly logger = new Logger(ViewTrackingService.name);
  private readonly redis: Redis;

  constructor(private readonly configService: ConfigService) {
    this.redis = new Redis({
      host: this.configService.getOrThrow<string>('redis.host'),
      port: Number(this.configService.getOrThrow<number>('redis.port')),
      password: this.configService.get<string>('redis.password') || undefined,
      maxRetriesPerRequest: 1,
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }

  /** Returns true the first time this (subject, entityId, visitorHash) combo is seen within the dedup window. */
  async shouldCountView(subject: string, entityId: string, visitorHash: string): Promise<boolean> {
    try {
      const key = `${KEY_PREFIX}:${subject}:${entityId}:${visitorHash}`;
      const result = await this.redis.set(key, '1', 'EX', DEDUP_WINDOW_SECONDS, 'NX');
      return result === 'OK';
    } catch (error) {
      this.logger.error(`View dedup check failed, counting the view: ${(error as Error).message}`);
      return true;
    }
  }
}

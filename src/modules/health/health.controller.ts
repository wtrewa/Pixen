import { Controller, Get, Inject, Logger } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import Redis from 'ioredis';
import { Public } from '../../common/decorators/public.decorator';
import { REDIS_CLIENT } from '../../infrastructure/redis/redis.constants';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    @Inject(REDIS_CLIENT) private readonly redisClient: Redis,
  ) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Health check' })
  async check() {
    const result: Record<string, string> = { status: 'ok' };

    try {
      await Promise.race([
        this.redisClient.ping(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Redis ping timed out')), 2000),
        ),
      ]);
      result.redis = 'ok';
    } catch (err) {
      this.logger.warn(`Redis health check failed: ${err.message}`);
      result.redis = 'unavailable';
    }

    return result;
  }
}

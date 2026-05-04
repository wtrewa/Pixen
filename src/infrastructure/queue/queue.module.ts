import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QUEUES } from '../../common/constants';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('REDIS_URL');
        if (url) {
          const parsed = new URL(url);
          return {
            redis: {
              host: parsed.hostname,
              port: Number(parsed.port) || 6379,
              password: parsed.password || undefined,
              family: 4,
              tls: url.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,
            },
          };
        }
        return {
          redis: {
            host: config.get<string>('redis.host'),
            port: config.get<number>('redis.port'),
            password: config.get<string>('redis.password') || undefined,
            family: 4,
          },
        };
      },
    }),
    BullModule.registerQueue(
      { name: QUEUES.NOTIFICATIONS },
      { name: QUEUES.EMAILS },
      { name: QUEUES.PAYMENTS },
    ),
  ],
  exports: [BullModule],
})
export class QueueModule {}

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
          // rediss:// enables TLS automatically in ioredis
          return { redis: url };
        }
        return {
          redis: {
            host: config.get<string>('redis.host'),
            port: config.get<number>('redis.port'),
            password: config.get<string>('redis.password') || undefined,
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

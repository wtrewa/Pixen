import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('database.url');
        const isProduction = process.env.NODE_ENV === 'production';
        const base = {
          type: 'postgres' as const,
          autoLoadEntities: true,
          synchronize: config.get<boolean>('database.sync'),
          logging: config.get<boolean>('database.logging'),
          entities: [__dirname + '/../**/*.entity{.ts,.js}'],
          ssl: isProduction ? { rejectUnauthorized: false } : false,
        };
        if (url) {
          return { ...base, url };
        }
        return {
          ...base,
          host: config.get<string>('database.host'),
          port: config.get<number>('database.port'),
          username: config.get<string>('database.username'),
          password: config.get<string>('database.password'),
          database: config.get<string>('database.name'),
        };
      },
    }),
  ],
})
export class DatabaseModule {}

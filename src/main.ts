import 'reflect-metadata';
import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { winstonConfig } from './infrastructure/logger/winston.config';
import * as winston from 'winston';
import { WinstonModule } from 'nest-winston';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger(winstonConfig),
  });

  const config = app.get(ConfigService);
  const port = config.get<number>('app.port', 3000);

  app.use(helmet());
  const frontendUrl = config.get<string>('FRONTEND_URL') ?? 'http://localhost:3002';
  app.enableCors({
    origin: true,
    credentials: true,
  });
  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Pixen API')
    .setDescription('Enterprise backend REST API')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(port);

  const logger = new (winston.createLogger(winstonConfig).constructor as any)(winstonConfig);
  console.log(`\n  API:    http://localhost:${port}/api/v1`);
  console.log(`  Docs:   http://localhost:${port}/api/docs`);
  console.log(`  Health: http://localhost:${port}/api/v1/health\n`);
}

bootstrap();

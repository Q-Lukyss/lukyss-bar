import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'node:path';
import { NestiaSwaggerComposer } from '@nestia/sdk';
import { OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import * as classTransformer from 'class-transformer';
import * as classValidator from 'class-validator';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      validatorPackage: classValidator,
      transformerPackage: classTransformer,
    }),
  );
  const port = Number(process.env.PORT ?? 3001);

  const document = await NestiaSwaggerComposer.document(app, {
    openapi: '3.1',
    servers: [
      {
        url: `http://localhost:${port}`,
        description: 'Local',
      },
    ],
  });

  SwaggerModule.setup('docs', app, document as OpenAPIObject);

  await app.listen(port);
}
bootstrap();

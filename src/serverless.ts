import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { Express } from 'express';
import { AppModule } from './app.module.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor.js';

let cachedExpressApp: Promise<Express> | undefined;

export function getExpressApp(): Promise<Express> {
  if (!cachedExpressApp) {
    cachedExpressApp = (async () => {
      const app = await NestFactory.create(AppModule);
      app.enableCors();
      app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
      app.useGlobalInterceptors(new TransformResponseInterceptor());
      app.useGlobalFilters(new HttpExceptionFilter());
      await app.init();
      return app.getHttpAdapter().getInstance();
    })();
  }
  return cachedExpressApp;
}

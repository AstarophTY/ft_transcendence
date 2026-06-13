import { mkdirSync } from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { UPLOADS_DIR } from './users/avatar.upload';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { MulterExceptionFilter } from './common/filters/multer-exception.filter';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap(): Promise<void> {
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
  dotenv.config({ path: path.resolve(process.cwd(), '../.env') });


  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  // Persisted avatars, served at /api/uploads/* through the nginx /api proxy.
  mkdirSync(`${UPLOADS_DIR}/avatars`, { recursive: true });
  app.useStaticAssets(UPLOADS_DIR, { prefix: '/api/uploads' });

  app.setGlobalPrefix('api');
  // Security headers (CSP, HSTS, X-Frame-Options, etc.). `crossOriginResourcePolicy`
  // is relaxed so the SPA (served from nginx) can load avatars from /api/uploads.
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  // Translate known infra errors (Prisma constraint races, oversized uploads)
  // into proper 4xx responses instead of leaking them as 500s. The catch-all
  // filter is registered LAST so the specific filters take precedence; it only
  // handles the leftovers (infra outages → 503, anything else → clean 500).
  app.useGlobalFilters(
    new AllExceptionsFilter(),
    new PrismaExceptionFilter(),
    new MulterExceptionFilter(),
  );
  app.enableCors({
    origin: config.get<string>('FRONTEND_URL', 'https://localhost'),
    credentials: true,
  });

  await app.listen(config.get<number>('PORT', 3000));
}

void bootstrap();

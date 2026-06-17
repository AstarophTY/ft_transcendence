import * as path from 'path';
import * as dotenv from 'dotenv';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AuthModule } from '@/auth/auth.module';

async function bootstrap(): Promise<void> {
  dotenv.config({ path: path.resolve(process.cwd(), '../.env') });


  const app = await NestFactory.create<NestExpressApplication>(AuthModule);
  const config = app.get(ConfigService);


  app.setGlobalPrefix('api');
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

  app.enableCors({
    origin: config.get<string>('FRONTEND_URL', 'https://localhost'),
    credentials: true,
  });

  await app.listen(config.get<number>('PORT', 3000));
}

void bootstrap();

import * as path from "node:path";
import * as dotenv from "dotenv";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import * as cookieParser from "cookie-parser";
import helmet from "helmet";
import { AuthModule } from "@/auth/auth.module";

async function bootstrap(): Promise<void> {
  dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

  const app = await NestFactory.create<NestExpressApplication>(AuthModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix("api");
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle("Transcendence API")
    .setDescription("The Transcendence API endpoints documentation")
    .setVersion("1.0")
    .addBearerAuth(
      {
        bearerFormat: "JWT",
        description: "Enter JWT token",
        in: "header",
        name: "JWT",
        scheme: "bearer",
        type: "http",
      },
      "JWT-auth",
    )
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api/docs", app, document);

  const frontendUrl = config.get<string>("FRONTEND_URL", "https://localhost");
  app.enableCors({
    credentials: true,
    origin: [frontendUrl, "null"],
  });

  await app.listen(config.get<number>("PORT", 3000));
}

void bootstrap();

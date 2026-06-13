import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

/**
 * Last-resort filter (registered last in `useGlobalFilters`). It lets the
 * specific filters (Prisma/Multer) and any business `HttpException` (4xx) pass
 * through untouched, and only handles what would otherwise become an opaque
 * 500. Infrastructure outages (Postgres/Redis unreachable) are reported as a
 * proper 503 (Service Unavailable) instead of 500, which is the honest status:
 * the request could not be served *right now*, but the input was not at fault.
 * Stack traces are logged server-side only — never leaked to the client.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();

    // Business HTTP exceptions (4xx and intentional 5xx) pass through as-is.
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      res.status(status).json(exception.getResponse());
      return;
    }

    // Database/cache unreachable → 503 rather than 500. A Prisma init failure
    // (P1001, server unreachable) is NOT a PrismaClientKnownRequestError, so it
    // is not caught by PrismaExceptionFilter and would surface as a raw 500.
    const code = (exception as { code?: string })?.code;
    const isInfra =
      exception instanceof Prisma.PrismaClientInitializationError ||
      exception instanceof Prisma.PrismaClientRustPanicError ||
      code === 'ECONNREFUSED' ||
      code === 'ETIMEDOUT' ||
      code === 'P1001' ||
      code === 'P1002';

    const status = isInfra
      ? HttpStatus.SERVICE_UNAVAILABLE
      : HttpStatus.INTERNAL_SERVER_ERROR;

    this.logger.error(
      'Unhandled exception',
      exception instanceof Error ? exception.stack : String(exception),
    );

    res.status(status).json({
      statusCode: status,
      message: isInfra
        ? 'Service temporarily unavailable'
        : 'Internal server error',
    });
  }
}

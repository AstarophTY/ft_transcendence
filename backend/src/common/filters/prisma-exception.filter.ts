import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

/**
 * Maps Prisma's known request errors to proper HTTP responses so they never
 * surface as an opaque 500. Without this, a unique-constraint race (e.g. two
 * concurrent sign-ups with the same email) or a write against a missing row
 * would bubble up as an Internal Server Error. The English messages stay stable
 * and are localized client-side (see frontend `lib/apiError.ts`).
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(
    exception: Prisma.PrismaClientKnownRequestError,
    host: ArgumentsHost,
  ): void {
    const res = host.switchToHttp().getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Something went wrong';

    switch (exception.code) {
      case 'P2002': // Unique constraint violation
        status = HttpStatus.CONFLICT;
        message = 'A record with these details already exists';
        break;
      case 'P2025': // Record required for the operation was not found
        status = HttpStatus.NOT_FOUND;
        message = 'Resource not found';
        break;
      case 'P2003': // Foreign key constraint failed
        status = HttpStatus.BAD_REQUEST;
        message = 'Related resource not found';
        break;
      default:
        // Unexpected Prisma error: log the details server-side but never leak
        // them to the client.
        this.logger.error(
          `Unhandled Prisma error ${exception.code}: ${exception.message}`,
        );
    }

    res.status(status).json({ statusCode: status, message });
  }
}

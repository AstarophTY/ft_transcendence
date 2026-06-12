import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { MulterError } from 'multer';

/**
 * Turns Multer upload errors into proper HTTP responses. The most common one is
 * an oversized avatar (`LIMIT_FILE_SIZE`, see `avatarMulterOptions`): without
 * this filter Multer's error is not an HttpException and would become a 500.
 * Messages are stable so the client can localize them (`lib/apiError.ts`).
 */
@Catch(MulterError)
export class MulterExceptionFilter implements ExceptionFilter {
  catch(exception: MulterError, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();

    const status =
      exception.code === 'LIMIT_FILE_SIZE'
        ? HttpStatus.PAYLOAD_TOO_LARGE
        : HttpStatus.BAD_REQUEST;
    const message =
      exception.code === 'LIMIT_FILE_SIZE'
        ? 'File too large'
        : 'File upload failed';

    res.status(status).json({ statusCode: status, message });
  }
}

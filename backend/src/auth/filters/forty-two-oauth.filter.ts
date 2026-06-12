import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';

/**
 * The 42 OAuth round-trip fails for reasons outside our control: the user
 * clicks "Decline" on the 42 consent page (`?error=access_denied`), or the
 * authorization code is expired / already used (e.g. the callback URL is
 * refreshed), which passport-oauth2 surfaces as a raw TokenError — a 500
 * without this filter. Either way the user's browser is sitting on a backend
 * URL, so a JSON error is a dead end: send them back to the frontend with a
 * stable error code the client localizes and toasts.
 */
@Catch()
@Injectable()
export class FortyTwoOAuthFilter implements ExceptionFilter {
  private readonly logger = new Logger(FortyTwoOAuthFilter.name);

  constructor(private readonly config: ConfigService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    const denied = req.query?.error === 'access_denied';
    if (!denied) {
      const message =
        exception instanceof Error ? exception.message : String(exception);
      this.logger.warn(`42 OAuth flow failed: ${message}`);
    }

    const frontend = this.config.get<string>(
      'FRONTEND_URL',
      'https://localhost',
    );
    const code = denied ? 'denied' : 'failed';
    res.redirect(`${frontend}/?auth_error=${code}`);
  }
}

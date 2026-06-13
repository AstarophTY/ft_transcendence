import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Global rate-limiter wired in as an `APP_GUARD`. It enforces the default
 * `ThrottlerModule` budget (100 req / 60 s per IP) on every HTTP route.
 *
 * WebSocket and other non-HTTP contexts are skipped: `ThrottlerGuard` resolves
 * the client through `switchToHttp()`, which is meaningless for the Socket.IO
 * gateways (`WorldGateway`/`FriendsGateway`) and would break real-time traffic.
 * Per-route limits (e.g. message sending, login brute-force via Redis) stay in
 * place on top of this baseline.
 */
@Injectable()
export class GlobalThrottlerGuard extends ThrottlerGuard {
  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    return context.getType() !== 'http';
  }
}

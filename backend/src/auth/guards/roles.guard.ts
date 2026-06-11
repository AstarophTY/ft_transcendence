import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthUser } from '../interfaces/auth.interfaces';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required || required.length === 0) {
      return true;
    }

    const authUser = ctx.switchToHttp().getRequest().user as AuthUser | undefined;
    if (!authUser) {
      return false;
    }

    // Authorize against the live DB role rather than the (possibly stale) JWT
    // claim, so a freshly promoted/demoted user takes effect immediately. The
    // client gates the admin UI on the up-to-date `/me` role; without this the
    // backend would still see the old role baked into the access token and 403.
    const user = await this.prisma.user.findUnique({
      where: { id: authUser.userId },
      select: { role: true },
    });
    return user !== null && required.includes(user.role);
  }
}

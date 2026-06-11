import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { FortyTwoService } from '../auth/forty-two.service';
import { FriendsGateway } from '../friends/friends.gateway';
import { FriendsService } from '../friends/friends.service';
import { PrismaService } from '../prisma/prisma.service';
import { SELF_USER_SELECT, SelfProfile, SelfUser } from './users.select';
import { UpdateProfileDto } from './dto/update-profile.dto';

/** Username may only be changed once every 30 days. */
export const USERNAME_COOLDOWN_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly fortyTwo: FortyTwoService,
    private readonly friends: FriendsService,
    private readonly gateway: FriendsGateway,
  ) {}

  /** Self profile plus the coin rate, so the UI can show progress to the next coin. */
  async getMe(userId: string): Promise<SelfProfile | null> {
    // Pull fresh 42 logtime (throttled, 1h) so the balance moves without re-login.
    await this.fortyTwo.resyncCoins(userId);
    const me = await this.prisma.user.findUnique({
      where: { id: userId },
      select: SELF_USER_SELECT,
    });
    if (!me) return null;
    const coinsPerHour =
      Number(this.config.get<string>('COINS_PER_HOUR', '1')) || 1;
    const siteLogtimeHours = (Date.now() - me.createdAt.getTime()) / 3_600_000;

    return { ...me, coinsPerHour, siteLogtimeHours };
  }

  /** Live 42 logtime diagnostics for the signed-in user. */
  debugLogtime(userId: string): Promise<Record<string, unknown>> {
    return this.fortyTwo.debugLogtime(userId);
  }

  /**
   * Permanently delete the account and everything it owns. All relations are
   * `onDelete: Cascade`, so a single delete removes the world, friendships,
   * messages and tokens too. Used when a new 42 user declines the Privacy
   * Policy, and when a user deletes their own account from the settings.
   *
   * Block-history rows (`BlockLog`) on shared campus worlds are intentionally
   * kept (their `userId` is a plain column, not a cascading relation): the
   * history survives and the client labels the now-missing author as a
   * deleted account.
   */
  async deleteAccount(userId: string): Promise<void> {
    // Snapshot the friends before the cascade wipes the friendships, then tell
    // their clients to drop this account once it's actually gone, so it
    // disappears from their friends list in real time.
    const friends = await this.friends.listFriends(userId);
    await this.prisma.user.delete({ where: { id: userId } });
    for (const friend of friends) {
      this.gateway.emitToUser(friend.id, 'friend:removed', { userId });
    }
  }

  /** Update freely-editable fields + optional avatar URL. */
  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
    avatar?: string,
  ): Promise<SelfUser> {
    if (dto.email !== undefined) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user?.fortyTwoId) {
        throw new BadRequestException('42 accounts cannot change their email');
      }
      const taken = await this.prisma.user.findFirst({
        where: { email: dto.email, NOT: { id: userId } },
      });
      if (taken) throw new ConflictException('Email already in use');
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: { ...dto, ...(avatar !== undefined ? { avatar } : {}) },
      select: SELF_USER_SELECT,
    });
  }

  /** Persist a freshly uploaded avatar URL. */
  setAvatar(userId: string, avatar: string): Promise<SelfUser> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { avatar },
      select: SELF_USER_SELECT,
    });
  }

  /** Change username, enforcing the 30-day cooldown. */
  async changeUsername(userId: string, username: string): Promise<SelfUser> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const remaining = this.cooldownRemaining(user.usernameChangedAt);
    if (remaining > 0) {
      throw new BadRequestException(
        `You can change your username again in ${remaining} day(s)`,
      );
    }
    if (await this.prisma.user.findUnique({ where: { username } })) {
      throw new ConflictException('Username already taken');
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: { username, usernameChangedAt: new Date() },
      select: SELF_USER_SELECT,
    });
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.passwordHash) {
      throw new BadRequestException('This account has no password set');
    }
    if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await bcrypt.hash(newPassword, 12) },
    });
  }

  /** Days left before the username can change again (0 if allowed now). */
  private cooldownRemaining(changedAt: Date | null): number {
    if (!changedAt) return 0;
    const elapsed = Date.now() - changedAt.getTime();
    const left = Math.ceil((USERNAME_COOLDOWN_DAYS * DAY_MS - elapsed) / DAY_MS);
    return Math.max(0, left);
  }
}

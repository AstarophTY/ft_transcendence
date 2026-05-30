import { Injectable } from '@nestjs/common';

/** Tracks which users are connected (multi-tab aware). */
@Injectable()
export class PresenceService {
  /** userId -> set of connected socket ids. */
  private readonly sockets = new Map<string, Set<string>>();

  /** Adds a socket; returns true if the user just came online. */
  add(userId: string, socketId: string): boolean {
    const existing = this.sockets.get(userId);
    if (existing) {
      existing.add(socketId);
      return false;
    }
    this.sockets.set(userId, new Set([socketId]));
    return true;
  }

  /** Removes a socket; returns true if the user is now fully offline. */
  remove(userId: string, socketId: string): boolean {
    const set = this.sockets.get(userId);
    if (!set) return false;
    set.delete(socketId);
    if (set.size === 0) {
      this.sockets.delete(userId);
      return true;
    }
    return false;
  }

  isOnline(userId: string): boolean {
    return this.sockets.has(userId);
  }
}

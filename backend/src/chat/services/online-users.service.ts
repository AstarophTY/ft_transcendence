import { Injectable } from '@nestjs/common';

@Injectable()
export class OnlineUsersService {
  private readonly userSockets = new Map<number, Set<string>>();

  addSocket(userId: number, socketId: string): void {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set<string>());
    }
    this.userSockets.get(userId)!.add(socketId);
  }

  removeSocket(userId: number, socketId: string): void {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
      }
    }
  }

  getSockets(userId: number): string[] {
    const sockets = this.userSockets.get(userId);
    return sockets ? Array.from(sockets) : [];
  }

  isOnline(userId: number): boolean {
    return this.userSockets.has(userId);
  }

  getOnlineUserIds(): number[] {
    return Array.from(this.userSockets.keys());
  }
}

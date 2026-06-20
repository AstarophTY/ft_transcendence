import { Injectable } from "@nestjs/common";

@Injectable()
export class OnlineUsersService {
  private readonly userSockets = new Map<number, Set<string>>();

  public addSocket(userId: number, socketId: string): void {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set<string>());
    }
    this.userSockets.get(userId)?.add(socketId);
  }

  public removeSocket(userId: number, socketId: string): void {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
      }
    }
  }

  public getSockets(userId: number): string[] {
    const sockets = this.userSockets.get(userId);
    return sockets ? [...sockets] : [];
  }

  public isOnline(userId: number): boolean {
    return this.userSockets.has(userId);
  }

  public getOnlineUserIds(): number[] {
    return [...this.userSockets.keys()];
  }
}

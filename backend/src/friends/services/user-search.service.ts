import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class UserSearchService {
  constructor(private readonly prisma: PrismaService) {}

  async searchUsers(userId: number, query: string) {
    if (!query || query.trim().length === 0) return [];
    
    return this.prisma.user.findMany({
      where: {
        username: {
          contains: query,
          mode: 'insensitive',
        },
        id: {
          not: userId,
        },
      },
      select: {
        id: true,
        username: true,
        campus: true,
      },
      take: 10,
    });
  }
}

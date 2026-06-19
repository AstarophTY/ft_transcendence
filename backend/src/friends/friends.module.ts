import { Module, forwardRef } from '@nestjs/common';
import { FriendsController } from '@/friends/controllers/friends.controller';
import { FriendshipsService } from '@/friends/services/friendships.service';
import { FriendRequestsService } from '@/friends/services/friend-requests.service';
import { UserSearchService } from '@/friends/services/user-search.service';
import { AuthModule } from '@/auth/auth.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { ChatModule } from '@/chat/chat.module';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    PrismaModule,
    forwardRef(() => ChatModule),
  ],
  controllers: [FriendsController],
  providers: [FriendshipsService, FriendRequestsService, UserSearchService],
  exports: [FriendshipsService, FriendRequestsService, UserSearchService],
})
export class FriendsModule {}

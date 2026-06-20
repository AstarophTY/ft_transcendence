import { Module, forwardRef } from "@nestjs/common";
import { ChatGateway } from "./gateways/chat.gateway";
import { ChatService } from "./services/chat.service";
import { OnlineUsersService } from "./services/online-users.service";
import { ChatController } from "./controllers/chat.controller";
import { AuthModule } from "@/auth/auth.module";
import { PrismaModule } from "@/prisma/prisma.module";
import { FriendsModule } from "@/friends/friends.module";

@Module({
  controllers: [ChatController],
  exports: [ChatGateway, ChatService, OnlineUsersService],
  imports: [forwardRef(() => AuthModule), PrismaModule, forwardRef(() => FriendsModule)],
  providers: [ChatGateway, ChatService, OnlineUsersService],
})
export class ChatModule {}

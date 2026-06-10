import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { FriendsController } from './friends.controller';
import { FriendsGateway } from './friends.gateway';
import { FriendsRepository } from './friends.repository';
import { FriendsService } from './friends.service';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { PresenceService } from './presence.service';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [RequestsController, MessagesController, FriendsController],
  providers: [
    FriendsRepository,
    FriendsService,
    RequestsService,
    MessagesService,
    PresenceService,
    FriendsGateway,
  ],
  exports: [FriendsService, FriendsGateway],
})
export class FriendsModule {}

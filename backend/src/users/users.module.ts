import { Module } from '@nestjs/common';
import { FortyTwoModule } from '../auth/forty-two.module';
import { FriendsModule } from '../friends/friends.module';
import { WorldModule } from '../world/world.module';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { UsersService } from './users.service';

@Module({
  imports: [FortyTwoModule, FriendsModule, WorldModule],
  controllers: [ProfileController],
  providers: [UsersService, ProfileService],
  exports: [UsersService],
})
export class UsersModule {}

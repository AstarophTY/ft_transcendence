import { Module } from '@nestjs/common';
import { FriendsModule } from '../friends/friends.module';
import { WorldModule } from '../world/world.module';
import { CampusController } from './campus.controller';
import { CampusService } from './campus.service';

@Module({
  imports: [WorldModule, FriendsModule],
  controllers: [CampusController],
  providers: [CampusService],
  exports: [CampusService],
})
export class CampusModule {}

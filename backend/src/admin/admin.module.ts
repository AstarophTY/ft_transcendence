import { Module } from '@nestjs/common';
import { FriendsModule } from '../friends/friends.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [FriendsModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}

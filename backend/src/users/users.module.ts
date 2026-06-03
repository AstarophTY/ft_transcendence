import { Module } from '@nestjs/common';
import { FortyTwoModule } from '../auth/forty-two.module';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { UsersService } from './users.service';

@Module({
  imports: [FortyTwoModule],
  controllers: [ProfileController],
  providers: [UsersService, ProfileService],
  exports: [UsersService],
})
export class UsersModule {}

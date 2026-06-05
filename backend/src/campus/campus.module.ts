import { Module } from '@nestjs/common';
import { WorldModule } from '../world/world.module';
import { CampusController } from './campus.controller';
import { CampusService } from './campus.service';

@Module({
  imports: [WorldModule],
  controllers: [CampusController],
  providers: [CampusService],
  exports: [CampusService],
})
export class CampusModule {}

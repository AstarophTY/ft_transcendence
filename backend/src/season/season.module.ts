import { forwardRef, Module } from '@nestjs/common';
import { WorldModule } from '../world/world.module';
import { SeasonController } from './season.controller';
import { SeasonService } from './season.service';

@Module({
  imports: [forwardRef(() => WorldModule)],
  controllers: [SeasonController],
  providers: [SeasonService],
  exports: [SeasonService],
})
export class SeasonModule {}

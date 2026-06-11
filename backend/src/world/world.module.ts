import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SeasonModule } from '../season/season.module';
import { WorldController } from './world.controller';
import { WorldGateway } from './world.gateway';
import { WorldService } from './world.service';

@Module({
  imports: [JwtModule.register({}), forwardRef(() => SeasonModule)],
  controllers: [WorldController],
  providers: [WorldService, WorldGateway],
  exports: [WorldService, WorldGateway],
})
export class WorldModule {}

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { WorldController } from './world.controller';
import { VoteController } from './vote.controller';
import { WorldGateway } from './world.gateway';
import { WorldService } from './world.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [WorldController, VoteController],
  providers: [WorldService, WorldGateway],
  exports: [WorldService, WorldGateway],
})
export class WorldModule {}

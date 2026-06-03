import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { WorldController } from './world.controller';
import { WorldGateway } from './world.gateway';
import { WorldService } from './world.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [WorldController],
  providers: [WorldService, WorldGateway],
  exports: [WorldService],
})
export class WorldModule {}

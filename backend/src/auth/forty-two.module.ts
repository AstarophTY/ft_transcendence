import { Module } from '@nestjs/common';
import { FortyTwoService } from './forty-two.service';

/** Shared 42-API access (logtime → coins), used by Auth and Users. */
@Module({
  providers: [FortyTwoService],
  exports: [FortyTwoService],
})
export class FortyTwoModule {}

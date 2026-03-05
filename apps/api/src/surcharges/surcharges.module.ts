import { Module } from '@nestjs/common';
import { SurchargesService } from './surcharges.service';
import { SurchargesController } from './surcharges.controller';

@Module({
  providers: [SurchargesService],
  controllers: [SurchargesController],
  exports: [SurchargesService],
})
export class SurchargesModule {}

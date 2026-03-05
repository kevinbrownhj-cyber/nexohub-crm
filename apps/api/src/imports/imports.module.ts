import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ImportsService } from './imports.service';
import { ImportsController } from './imports.controller';
import { ImportsProcessor } from './imports.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'imports',
    }),
  ],
  providers: [ImportsService, ImportsProcessor],
  controllers: [ImportsController],
  exports: [ImportsService],
})
export class ImportsModule {}

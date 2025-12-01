import { Module } from '@nestjs/common';
import { GenerateReportController } from './generate-report.controller';
import { GenerateReportService } from './generate-report.service';

@Module({
  controllers: [GenerateReportController],
  providers: [GenerateReportService],
  exports: [GenerateReportService],
})
export class GenerateReportModule {}

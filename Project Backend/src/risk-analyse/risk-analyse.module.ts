import { Module } from '@nestjs/common';
import { RiskAnalyseController } from './risk-analyse.controller';
import { RiskAnalyseService } from './risk-analyse.service';

@Module({
  controllers: [RiskAnalyseController],
  providers: [RiskAnalyseService],
  exports: [RiskAnalyseService],
})
export class RiskAnalyseModule {}

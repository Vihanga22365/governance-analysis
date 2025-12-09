import { Module } from '@nestjs/common';
import { CostClarificationsController } from './cost-clarifications.controller';
import { CostClarificationsService } from './cost-clarifications.service';

@Module({
  controllers: [CostClarificationsController],
  providers: [CostClarificationsService],
  exports: [CostClarificationsService],
})
export class CostClarificationsModule {}

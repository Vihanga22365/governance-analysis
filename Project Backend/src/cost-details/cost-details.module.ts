import { Module } from '@nestjs/common';
import { CostDetailsController } from './cost-details.controller';
import { CostDetailsService } from './cost-details.service';

@Module({
  controllers: [CostDetailsController],
  providers: [CostDetailsService],
  exports: [CostDetailsService],
})
export class CostDetailsModule {}

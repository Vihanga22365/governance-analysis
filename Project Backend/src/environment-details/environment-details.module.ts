import { Module } from '@nestjs/common';
import { EnvironmentDetailsController } from './environment-details.controller';
import { EnvironmentDetailsService } from './environment-details.service';

@Module({
  controllers: [EnvironmentDetailsController],
  providers: [EnvironmentDetailsService],
  exports: [EnvironmentDetailsService],
})
export class EnvironmentDetailsModule {}

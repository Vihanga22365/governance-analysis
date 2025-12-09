import { Module } from '@nestjs/common';
import { EnvironmentClarificationsController } from './environment-clarifications.controller';
import { EnvironmentClarificationsService } from './environment-clarifications.service';

@Module({
  controllers: [EnvironmentClarificationsController],
  providers: [EnvironmentClarificationsService],
  exports: [EnvironmentClarificationsService],
})
export class EnvironmentClarificationsModule {}

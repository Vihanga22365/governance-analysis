import { Module } from '@nestjs/common';
import { CommitteeClarificationsController } from './committee-clarifications.controller';
import { CommitteeClarificationsService } from './committee-clarifications.service';

@Module({
  controllers: [CommitteeClarificationsController],
  providers: [CommitteeClarificationsService],
  exports: [CommitteeClarificationsService],
})
export class CommitteeClarificationsModule {}

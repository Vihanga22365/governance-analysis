import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { CommitteeClarificationsService } from './committee-clarifications.service';
import { CreateCommitteeClarificationDto } from './dto/create-committee-clarification.dto';
import { UpdateCommitteeClarificationDto } from './dto/update-committee-clarification.dto';

@Controller('api/committee-clarifications')
export class CommitteeClarificationsController {
  constructor(
    private readonly committeeClarificationsService: CommitteeClarificationsService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateCommitteeClarificationDto) {
    const data =
      await this.committeeClarificationsService.createCommitteeClarifications(
        dto,
      );
    return {
      message: 'Committee clarifications created successfully',
      data,
    };
  }

  @Put(':governanceId/:committeeType')
  @HttpCode(HttpStatus.OK)
  async updateClarification(
    @Param('governanceId') governanceId: string,
    @Param('committeeType') committeeType: string,
    @Body() dto: UpdateCommitteeClarificationDto,
  ) {
    const data = await this.committeeClarificationsService.updateClarifications(
      governanceId,
      committeeType as any,
      dto,
    );
    return {
      message: 'Committee clarifications updated successfully',
      data,
    };
  }

  @Get('governance/:governanceId')
  @HttpCode(HttpStatus.OK)
  async getByGovernanceId(@Param('governanceId') governanceId: string) {
    const data =
      await this.committeeClarificationsService.getClarificationsByGovernanceId(
        governanceId,
      );
    return {
      message: 'Committee clarifications fetched successfully',
      governanceId,
      data,
    };
  }
}

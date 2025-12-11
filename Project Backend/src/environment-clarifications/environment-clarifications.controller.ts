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
import { EnvironmentClarificationsService } from './environment-clarifications.service';
import { CreateEnvironmentClarificationDto } from './dto/create-environment-clarification.dto';
import { UpdateEnvironmentClarificationDto } from './dto/update-environment-clarification.dto';

@Controller('api/environment-clarifications')
export class EnvironmentClarificationsController {
  constructor(
    private readonly environmentClarificationsService: EnvironmentClarificationsService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateEnvironmentClarificationDto) {
    const data =
      await this.environmentClarificationsService.createEnvironmentClarifications(
        dto,
      );
    return {
      message: 'Environment clarifications created successfully',
      data,
    };
  }

  @Put(':governanceId')
  @HttpCode(HttpStatus.OK)
  async updateClarification(
    @Param('governanceId') governanceId: string,
    @Body() dto: UpdateEnvironmentClarificationDto,
  ) {
    const data =
      await this.environmentClarificationsService.updateClarifications(
        governanceId,
        dto,
      );
    return {
      message: 'Clarifications updated successfully',
      data,
    };
  }

  @Get('governance/:governanceId')
  @HttpCode(HttpStatus.OK)
  async getByGovernanceId(@Param('governanceId') governanceId: string) {
    const data =
      await this.environmentClarificationsService.getClarificationsByGovernanceId(
        governanceId,
      );
    return {
      message: 'Clarifications fetched successfully',
      governanceId,
      data,
    };
  }
}

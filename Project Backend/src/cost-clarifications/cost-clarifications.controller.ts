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
import { CostClarificationsService } from './cost-clarifications.service';
import { CreateCostClarificationDto } from './dto/create-cost-clarification.dto';
import { UpdateCostClarificationDto } from './dto/update-cost-clarification.dto';

@Controller('api/cost-clarifications')
export class CostClarificationsController {
  constructor(
    private readonly costClarificationsService: CostClarificationsService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateCostClarificationDto) {
    const data =
      await this.costClarificationsService.createCostClarifications(dto);
    return {
      message: 'Cost clarifications created successfully',
      data,
    };
  }

  @Put(':governanceId')
  @HttpCode(HttpStatus.OK)
  async updateClarification(
    @Param('governanceId') governanceId: string,
    @Body() dto: UpdateCostClarificationDto,
  ) {
    const data = await this.costClarificationsService.updateClarifications(
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
      await this.costClarificationsService.getClarificationsByGovernanceId(
        governanceId,
      );
    return {
      message: 'Clarifications fetched successfully',
      governanceId,
      data,
    };
  }
}

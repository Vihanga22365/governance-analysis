import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CostDetailsService } from './cost-details.service';
import { CreateCostDetailsDto } from './dto/create-cost-details.dto';

@Controller('api/cost-details')
export class CostDetailsController {
  constructor(private readonly costDetailsService: CostDetailsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createCostDetails(@Body() createCostDetailsDto: CreateCostDetailsDto) {
    const costDetails =
      await this.costDetailsService.createCostDetails(createCostDetailsDto);
    return {
      message: 'Cost details created successfully',
      data: costDetails,
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllCostDetails() {
    const costDetails = await this.costDetailsService.getAllCostDetails();
    return {
      message: 'Cost details fetched successfully',
      data: costDetails,
      count: costDetails.length,
    };
  }

  @Get(':costDetailsId')
  @HttpCode(HttpStatus.OK)
  async getCostDetailsById(@Param('costDetailsId') costDetailsId: string) {
    const costDetails =
      await this.costDetailsService.getCostDetailsById(costDetailsId);
    if (!costDetails) {
      return {
        message: 'Cost details not found',
        data: null,
      };
    }
    return {
      message: 'Cost details fetched successfully',
      data: costDetails,
    };
  }

  @Get('governance/:governanceId')
  @HttpCode(HttpStatus.OK)
  async getCostDetailsByGovernanceId(
    @Param('governanceId') governanceId: string,
  ) {
    const costDetails =
      await this.costDetailsService.getCostDetailsByGovernanceId(governanceId);
    return {
      message: 'Cost details fetched successfully',
      governanceId,
      data: costDetails,
      count: costDetails.length,
    };
  }
}

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { EnvironmentDetailsService } from './environment-details.service';
import { CreateEnvironmentDetailsDto } from './dto/create-environment-details.dto';

@Controller('api/environment-details')
export class EnvironmentDetailsController {
  constructor(
    private readonly environmentDetailsService: EnvironmentDetailsService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createEnvironmentDetails(
    @Body() createEnvironmentDetailsDto: CreateEnvironmentDetailsDto,
  ) {
    const environmentDetails =
      await this.environmentDetailsService.createEnvironmentDetails(
        createEnvironmentDetailsDto,
      );
    return {
      message: 'Environment details created successfully',
      data: environmentDetails,
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllEnvironmentDetails() {
    const environmentDetails =
      await this.environmentDetailsService.getAllEnvironmentDetails();
    return {
      message: 'Environment details fetched successfully',
      data: environmentDetails,
      count: environmentDetails.length,
    };
  }

  @Get(':environmentDetailsId')
  @HttpCode(HttpStatus.OK)
  async getEnvironmentDetailsById(
    @Param('environmentDetailsId') environmentDetailsId: string,
  ) {
    const environmentDetails =
      await this.environmentDetailsService.getEnvironmentDetailsById(
        environmentDetailsId,
      );
    if (!environmentDetails) {
      return {
        message: 'Environment details not found',
        data: null,
      };
    }
    return {
      message: 'Environment details fetched successfully',
      data: environmentDetails,
    };
  }

  @Get('governance/:governanceId')
  @HttpCode(HttpStatus.OK)
  async getEnvironmentDetailsByGovernanceId(
    @Param('governanceId') governanceId: string,
  ) {
    const environmentDetails =
      await this.environmentDetailsService.getEnvironmentDetailsByGovernanceId(
        governanceId,
      );
    return {
      message: 'Environment details fetched successfully',
      governanceId,
      data: environmentDetails,
      count: environmentDetails.length,
    };
  }
}

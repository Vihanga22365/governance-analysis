import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RiskAnalyseService } from './risk-analyse.service';
import { CreateRiskAnalysisDto } from './dto/create-risk-analysis.dto';
import { UpdateCommitteeStatusDto } from './dto/update-committee-status.dto';

@Controller('api/risk-analyse')
export class RiskAnalyseController {
  constructor(private readonly riskAnalyseService: RiskAnalyseService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createRiskAnalysis(
    @Body() createRiskAnalysisDto: CreateRiskAnalysisDto,
  ) {
    const riskAnalysis = await this.riskAnalyseService.createRiskAnalysis(
      createRiskAnalysisDto,
    );
    return {
      message: 'Risk analysis created successfully',
      data: riskAnalysis,
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllRiskAnalyses() {
    const riskAnalyses = await this.riskAnalyseService.getAllRiskAnalyses();
    return {
      message: 'Risk analyses fetched successfully',
      data: riskAnalyses,
      count: riskAnalyses.length,
    };
  }

  @Get(':riskAnalysisId')
  @HttpCode(HttpStatus.OK)
  async getRiskAnalysisById(@Param('riskAnalysisId') riskAnalysisId: string) {
    const riskAnalysis =
      await this.riskAnalyseService.getRiskAnalysisById(riskAnalysisId);
    if (!riskAnalysis) {
      return {
        message: 'Risk analysis not found',
        data: null,
      };
    }
    return {
      message: 'Risk analysis fetched successfully',
      data: riskAnalysis,
    };
  }

  @Get('governance/:governanceId')
  @HttpCode(HttpStatus.OK)
  async getRiskAnalysesByGovernanceId(
    @Param('governanceId') governanceId: string,
  ) {
    const riskAnalyses =
      await this.riskAnalyseService.getRiskAnalysesByGovernanceId(governanceId);
    return {
      message: 'Risk analyses fetched successfully',
      governanceId,
      data: riskAnalyses,
      count: riskAnalyses.length,
    };
  }

  @Put('update-committee')
  @HttpCode(HttpStatus.OK)
  async updateCommitteeStatus(
    @Body() updateCommitteeStatusDto: UpdateCommitteeStatusDto,
  ) {
    const updatedRiskAnalysis =
      await this.riskAnalyseService.updateCommitteeStatus(
        updateCommitteeStatusDto,
      );
    return {
      message: 'Committee status updated successfully',
      data: updatedRiskAnalysis,
    };
  }
}

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { GenerateReportService } from './generate-report.service';
import { CreateReportDto } from './dto/create-report.dto';

@Controller('api/generate-report')
export class GenerateReportController {
  constructor(private readonly generateReportService: GenerateReportService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createReport(@Body() createReportDto: CreateReportDto) {
    const report =
      await this.generateReportService.createReport(createReportDto);
    return {
      message: 'Report generated successfully',
      data: report,
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllReports() {
    const reports = await this.generateReportService.getAllReports();
    return {
      message: 'Reports fetched successfully',
      data: reports,
      count: reports.length,
    };
  }

  @Get(':reportId')
  @HttpCode(HttpStatus.OK)
  async getReportById(@Param('reportId') reportId: string) {
    const report = await this.generateReportService.getReportById(reportId);
    if (!report) {
      return {
        message: 'Report not found',
        data: null,
      };
    }
    return {
      message: 'Report fetched successfully',
      data: report,
    };
  }

  @Get('governance/:governanceId')
  @HttpCode(HttpStatus.OK)
  async getReportsByGovernanceId(@Param('governanceId') governanceId: string) {
    const reports =
      await this.generateReportService.getReportsByGovernanceId(governanceId);
    return {
      message: 'Reports fetched successfully',
      governanceId,
      data: reports,
      count: reports.length,
    };
  }
}

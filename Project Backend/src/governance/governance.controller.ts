import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { GovernanceService } from './governance.service';
import { CreateGovernanceDto } from './dto/create-governance.dto';

@Controller('api/governance')
export class GovernanceController {
  constructor(private readonly governanceService: GovernanceService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createGovernance(@Body() createGovernanceDto: CreateGovernanceDto) {
    return this.governanceService.createGovernanceDetails(createGovernanceDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllGovernance() {
    const data = await this.governanceService.getAllGovernanceDetails();
    return {
      message: 'Governance details fetched successfully',
      data,
    };
  }

  @Get('search/:searchTerm')
  @HttpCode(HttpStatus.OK)
  async searchGovernance(@Param('searchTerm') searchTerm: string) {
    const data = await this.governanceService.searchGovernance(searchTerm);
    return {
      message: 'Search completed successfully',
      searchTerm,
      data,
      count: data.length,
    };
  }

  @Get(':governanceId')
  @HttpCode(HttpStatus.OK)
  async getGovernanceById(@Param('governanceId') governanceId: string) {
    const data = await this.governanceService.getGovernanceById(governanceId);
    if (!data) {
      return {
        message: 'Governance not found',
        data: null,
      };
    }
    return {
      message: 'Governance details fetched successfully',
      data,
    };
  }

  @Post('upload/:uuid')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(@Param('uuid') uuid: string, @UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.governanceService.uploadDocument(uuid, file);
  }

  @Post('upload-multiple/:uuid')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FilesInterceptor('files', 10)) // Max 10 files at once
  async uploadMultipleDocuments(
    @Param('uuid') uuid: string,
    @UploadedFiles() files: any[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }
    return this.governanceService.uploadMultipleDocuments(uuid, files);
  }

  @Get('documents/:uuid')
  @HttpCode(HttpStatus.OK)
  async getDocuments(@Param('uuid') uuid: string) {
    const files = await this.governanceService.getUploadedDocuments(uuid);
    return {
      message: 'Documents retrieved successfully',
      uuid,
      files,
      count: files.length,
    };
  }
}

import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { FirebaseConfig } from '../config/firebase.config';
import { CreateReportDto } from './dto/create-report.dto';
import { ReportResponseDto } from './dto/report-response.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class GenerateReportService {
  private readonly tableName = 'generated_reports';
  private readonly governanceTableName = 'governance_basic_details';

  constructor(private readonly firebaseConfig: FirebaseConfig) {}

  private async generateReportId(): Promise<string> {
    const database = this.firebaseConfig.getDatabase();
    const reportRef = database.ref(this.tableName);
    const snapshot = await reportRef.once('value');
    const data = snapshot.val();

    if (!data) {
      return 'RPT0001';
    }

    // Get all report IDs and find the highest number
    const ids = Object.values(data).map((item: any) => item.report_id);
    const numbers = ids
      .map((id: string) => parseInt(id.replace('RPT', ''), 10))
      .filter((num) => !isNaN(num));

    const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
    const nextNumber = maxNumber + 1;

    return `RPT${nextNumber.toString().padStart(4, '0')}`;
  }

  private async getDocumentsByGovernanceId(
    governanceId: string,
  ): Promise<string[]> {
    try {
      const database = this.firebaseConfig.getDatabase();
      const governanceRef = database.ref(this.governanceTableName);

      const snapshot = await governanceRef
        .orderByChild('governance_id')
        .equalTo(governanceId)
        .once('value');

      const data = snapshot.val();

      if (!data) {
        throw new NotFoundException(
          `Governance with ID ${governanceId} not found`,
        );
      }

      // Get the first (and should be only) governance record
      const governanceRecord = Object.values(data)[0] as any;

      // Extract document paths from relevant_documents
      const documents: string[] = [];

      if (
        governanceRecord.relevant_documents &&
        Array.isArray(governanceRecord.relevant_documents)
      ) {
        governanceRecord.relevant_documents.forEach((doc: any) => {
          if (doc.documentUrl) {
            documents.push(doc.documentUrl);
          }
        });
      }

      return documents;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to retrieve documents: ${error.message}`,
      );
    }
  }

  async createReport(
    createReportDto: CreateReportDto,
  ): Promise<ReportResponseDto> {
    try {
      // Get documents for the governance_id
      const documents = await this.getDocumentsByGovernanceId(
        createReportDto.governance_id,
      );

      // Generate report ID
      const report_id = await this.generateReportId();

      // Create report data
      const reportData = {
        report_id,
        user_name: createReportDto.user_name,
        governance_id: createReportDto.governance_id,
        report_content: createReportDto.report_content,
        documents,
        created_at: new Date().toISOString(),
      };

      // Save to Firebase
      const database = this.firebaseConfig.getDatabase();
      const reportRef = database.ref(this.tableName);
      const newReportRef = reportRef.push();
      await newReportRef.set(reportData);

      return {
        user_name: reportData.user_name,
        governance_id: reportData.governance_id,
        report_content: reportData.report_content,
        documents: reportData.documents,
        created_at: reportData.created_at,
        report_id: reportData.report_id,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to create report: ${error.message}`,
      );
    }
  }

  async getAllReports(): Promise<ReportResponseDto[]> {
    try {
      const database = this.firebaseConfig.getDatabase();
      const reportRef = database.ref(this.tableName);

      const snapshot = await reportRef.once('value');
      const data = snapshot.val();

      if (!data) {
        return [];
      }

      // Convert object to array
      return Object.keys(data).map((key) => ({
        ...data[key],
        id: key,
      }));
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to fetch reports: ${error.message}`,
      );
    }
  }

  async getReportById(reportId: string): Promise<ReportResponseDto | null> {
    try {
      const database = this.firebaseConfig.getDatabase();
      const reportRef = database.ref(this.tableName);

      const snapshot = await reportRef
        .orderByChild('report_id')
        .equalTo(reportId)
        .once('value');

      const data = snapshot.val();

      if (!data) {
        return null;
      }

      // Return the first (and should be only) matching report
      const reportKey = Object.keys(data)[0];
      return {
        ...data[reportKey],
        id: reportKey,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to fetch report: ${error.message}`,
      );
    }
  }

  async getReportsByGovernanceId(
    governanceId: string,
  ): Promise<ReportResponseDto[]> {
    try {
      const database = this.firebaseConfig.getDatabase();
      const reportRef = database.ref(this.tableName);

      const snapshot = await reportRef
        .orderByChild('governance_id')
        .equalTo(governanceId)
        .once('value');

      const data = snapshot.val();

      if (!data) {
        return [];
      }

      // Convert object to array
      return Object.keys(data).map((key) => ({
        ...data[key],
        id: key,
      }));
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to fetch reports by governance ID: ${error.message}`,
      );
    }
  }
}

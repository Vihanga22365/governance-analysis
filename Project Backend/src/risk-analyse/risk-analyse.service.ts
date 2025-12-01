import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { FirebaseConfig } from '../config/firebase.config';
import {
  CreateRiskAnalysisDto,
  RiskLevel,
} from './dto/create-risk-analysis.dto';
import {
  RiskAnalysisResponseDto,
  CommitteeStatus,
} from './dto/risk-analysis-response.dto';

@Injectable()
export class RiskAnalyseService {
  private readonly tableName = 'risk_analysis';
  private readonly governanceTableName = 'governance_basic_details';

  constructor(private readonly firebaseConfig: FirebaseConfig) {}

  private async generateRiskAnalysisId(): Promise<string> {
    const database = this.firebaseConfig.getDatabase();
    const riskRef = database.ref(this.tableName);
    const snapshot = await riskRef.once('value');
    const data = snapshot.val();

    if (!data) {
      return 'RISK0001';
    }

    // Get all risk analysis IDs and find the highest number
    const ids = Object.values(data).map((item: any) => item.risk_analysis_id);
    const numbers = ids
      .map((id: string) => parseInt(id.replace('RISK', ''), 10))
      .filter((num) => !isNaN(num));

    const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
    const nextNumber = maxNumber + 1;

    return `RISK${nextNumber.toString().padStart(4, '0')}`;
  }

  private async verifyGovernanceExists(governanceId: string): Promise<void> {
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
  }

  private setCommitteeStatus(riskLevel: RiskLevel): {
    committee_1: CommitteeStatus;
    committee_2: CommitteeStatus;
    committee_3: CommitteeStatus;
  } {
    switch (riskLevel) {
      case RiskLevel.LOW:
        return {
          committee_1: CommitteeStatus.PENDING,
          committee_2: CommitteeStatus.NOT_NEEDED,
          committee_3: CommitteeStatus.NOT_NEEDED,
        };
      case RiskLevel.MEDIUM:
        return {
          committee_1: CommitteeStatus.PENDING,
          committee_2: CommitteeStatus.PENDING,
          committee_3: CommitteeStatus.NOT_NEEDED,
        };
      case RiskLevel.HIGH:
        return {
          committee_1: CommitteeStatus.PENDING,
          committee_2: CommitteeStatus.PENDING,
          committee_3: CommitteeStatus.PENDING,
        };
      default:
        return {
          committee_1: CommitteeStatus.PENDING,
          committee_2: CommitteeStatus.NOT_NEEDED,
          committee_3: CommitteeStatus.NOT_NEEDED,
        };
    }
  }

  async createRiskAnalysis(
    createRiskAnalysisDto: CreateRiskAnalysisDto,
  ): Promise<RiskAnalysisResponseDto> {
    try {
      // Verify governance exists
      await this.verifyGovernanceExists(createRiskAnalysisDto.governance_id);

      // Generate risk analysis ID
      const risk_analysis_id = await this.generateRiskAnalysisId();

      // Set committee status based on risk level
      const committeeStatus = this.setCommitteeStatus(
        createRiskAnalysisDto.risk_level,
      );

      // Create risk analysis data
      const riskAnalysisData = {
        risk_analysis_id,
        user_name: createRiskAnalysisDto.user_name,
        governance_id: createRiskAnalysisDto.governance_id,
        risk_level: createRiskAnalysisDto.risk_level,
        reason: createRiskAnalysisDto.reason,
        committee_1: committeeStatus.committee_1,
        committee_2: committeeStatus.committee_2,
        committee_3: committeeStatus.committee_3,
        created_at: new Date().toISOString(),
      };

      // Save to Firebase
      const database = this.firebaseConfig.getDatabase();
      const riskRef = database.ref(this.tableName);
      const newRiskRef = riskRef.push();
      await newRiskRef.set(riskAnalysisData);

      return {
        risk_analysis_id: riskAnalysisData.risk_analysis_id,
        user_name: riskAnalysisData.user_name,
        governance_id: riskAnalysisData.governance_id,
        risk_level: riskAnalysisData.risk_level,
        reason: riskAnalysisData.reason,
        committee_1: riskAnalysisData.committee_1,
        committee_2: riskAnalysisData.committee_2,
        committee_3: riskAnalysisData.committee_3,
        created_at: riskAnalysisData.created_at,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to create risk analysis: ${error.message}`,
      );
    }
  }

  async getAllRiskAnalyses(): Promise<RiskAnalysisResponseDto[]> {
    try {
      const database = this.firebaseConfig.getDatabase();
      const riskRef = database.ref(this.tableName);

      const snapshot = await riskRef.once('value');
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
        `Failed to fetch risk analyses: ${error.message}`,
      );
    }
  }

  async getRiskAnalysisById(
    riskAnalysisId: string,
  ): Promise<RiskAnalysisResponseDto | null> {
    try {
      const database = this.firebaseConfig.getDatabase();
      const riskRef = database.ref(this.tableName);

      const snapshot = await riskRef
        .orderByChild('risk_analysis_id')
        .equalTo(riskAnalysisId)
        .once('value');

      const data = snapshot.val();

      if (!data) {
        return null;
      }

      // Return the first (and should be only) matching risk analysis
      const riskKey = Object.keys(data)[0];
      return {
        ...data[riskKey],
        id: riskKey,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to fetch risk analysis: ${error.message}`,
      );
    }
  }

  async getRiskAnalysesByGovernanceId(
    governanceId: string,
  ): Promise<RiskAnalysisResponseDto[]> {
    try {
      const database = this.firebaseConfig.getDatabase();
      const riskRef = database.ref(this.tableName);

      const snapshot = await riskRef
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
        `Failed to fetch risk analyses by governance ID: ${error.message}`,
      );
    }
  }
}

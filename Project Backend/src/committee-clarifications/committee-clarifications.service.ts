import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { FirebaseConfig } from '../config/firebase.config';
import {
  COMMITTEE_CLARIFICATION_DEFINITIONS,
  COMMITTEE_TYPES,
  CommitteeType,
  ClarificationStatus,
} from './committee-clarifications.constants';
import { CreateCommitteeClarificationDto } from './dto/create-committee-clarification.dto';
import { UpdateCommitteeClarificationDto } from './dto/update-committee-clarification.dto';
import { CommitteeClarificationResponseDto } from './dto/committee-clarification-response.dto';

@Injectable()
export class CommitteeClarificationsService {
  private readonly tableName = 'committee_clarifications';
  private readonly governanceTableName = 'governance_basic_details';

  constructor(private readonly firebaseConfig: FirebaseConfig) {}

  private isValidCommitteeType(type: string): type is CommitteeType {
    return (COMMITTEE_TYPES as readonly string[]).includes(type);
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

  private getMockAnswers(): Record<string, string> {
    return {
      // Committee 1
      core_business_impact: 'Yes, this impacts core business operations',
      internal_users_only: 'This is for internal users only',
      tech_approved_org: 'Technology is approved and commonly used',
      // Committee 2
      sensitive_data: 'Application handles business data',
      system_integration: 'Integrates with internal systems',
      block_other_teams: 'Failure would not block other teams',
      // Committee 3
      regulatory_compliance: 'Compliant with regulatory requirements',
      reputation_impact: 'No negative reputation impact expected',
      multi_business_scale: 'Affects multiple business units',
    };
  }

  private getCommitteesForRiskLevel(
    riskLevel: 'low' | 'medium' | 'high',
  ): CommitteeType[] {
    switch (riskLevel) {
      case 'low':
        return ['committee_1'];
      case 'medium':
        return ['committee_1', 'committee_2'];
      case 'high':
        return ['committee_1', 'committee_2', 'committee_3'];
    }
  }

  private getMockAnswerIndicesForRiskLevel(
    riskLevel: 'low' | 'medium' | 'high',
  ): Record<CommitteeType, number[]> {
    // Returns indices of questions to mock-answer; others get "NOT PROVIDE"
    switch (riskLevel) {
      case 'low':
        // Committee 1: mock first question, pending others
        return {
          committee_1: [0], // core_business_impact only
          committee_2: [],
          committee_3: [],
        };
      case 'medium':
        // Committee 1: all questions, Committee 2: first question
        return {
          committee_1: [0, 1, 2], // all questions
          committee_2: [0], // sensitive_data only
          committee_3: [],
        };
      case 'high':
        // Committee 1: all, Committee 2: all, Committee 3: first question
        return {
          committee_1: [0, 1, 2],
          committee_2: [0, 1, 2],
          committee_3: [0], // regulatory_compliance only
        };
    }
  }

  private buildCommitteeClarifications(
    overrides: CreateCommitteeClarificationDto['clarifications'] = [],
    riskLevel: 'low' | 'medium' | 'high' = 'low',
  ) {
    const clarifications: Partial<Record<CommitteeType, any[]>> = {};

    const committeesToInclude = this.getCommitteesForRiskLevel(riskLevel);
    const mockAnswerIndices = this.getMockAnswerIndicesForRiskLevel(riskLevel);
    const mockAnswers = this.getMockAnswers();

    const overrideMap = new Map<
      string,
      { user_answer?: string; status?: ClarificationStatus }
    >();
    overrides?.forEach((item) => {
      overrideMap.set(item.unique_code, {
        user_answer: item.user_answer,
        status: item.status as ClarificationStatus,
      });
    });

    // Only create committees that are included for this risk level
    for (const committeeType of committeesToInclude) {
      const definitions = COMMITTEE_CLARIFICATION_DEFINITIONS[committeeType];

      clarifications[committeeType] = definitions.map((definition, index) => {
        const override = overrideMap.get(definition.unique_code);
        const shouldMockAnswer =
          mockAnswerIndices[committeeType].includes(index);

        // Determine user answer
        const userAnswer =
          override?.user_answer?.trim() &&
          override.user_answer.trim().length > 0
            ? override.user_answer.trim()
            : shouldMockAnswer
              ? mockAnswers[definition.unique_code]
              : 'NOT PROVIDE';

        // Set status to 'completed' if answer is provided (not 'NOT PROVIDE')
        const status =
          override?.status ||
          (userAnswer !== 'NOT PROVIDE'
            ? ('completed' as ClarificationStatus)
            : ('pending' as ClarificationStatus));

        return {
          clarification: definition.clarification,
          unique_code: definition.unique_code,
          user_answer: userAnswer,
          status: status,
        };
      });
    }

    return clarifications as Record<CommitteeType, any[]>;
  }

  private async findByGovernanceId(governanceId: string) {
    const database = this.firebaseConfig.getDatabase();
    const clarificationsRef = database.ref(this.tableName);

    const snapshot = await clarificationsRef
      .orderByChild('governance_id')
      .equalTo(governanceId)
      .once('value');

    const data = snapshot.val();

    if (!data) {
      return null;
    }

    const key = Object.keys(data)[0];
    return { key, value: data[key] as CommitteeClarificationResponseDto };
  }

  async createCommitteeClarifications(
    dto: CreateCommitteeClarificationDto,
  ): Promise<CommitteeClarificationResponseDto> {
    try {
      await this.verifyGovernanceExists(dto.governance_id);

      const database = this.firebaseConfig.getDatabase();
      const clarificationsRef = database.ref(this.tableName);

      const existing = await this.findByGovernanceId(dto.governance_id);

      if (existing) {
        throw new BadRequestException(
          `Committee clarifications already exist for governance ID ${dto.governance_id}`,
        );
      }

      const now = new Date().toISOString();
      const clarifications = this.buildCommitteeClarifications(
        dto.clarifications,
        dto.risk_level,
      );

      const responseData: CommitteeClarificationResponseDto = {
        governance_id: dto.governance_id,
        user_name: dto.user_name,
        risk_level: dto.risk_level,
        created_at: now,
        updated_at: now,
        clarifications,
      };

      const newRef = clarificationsRef.push();
      await newRef.set(responseData);

      return {
        ...responseData,
        id: newRef.key,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to create committee clarifications',
      );
    }
  }

  async updateClarifications(
    governanceId: string,
    committeeType: CommitteeType,
    dto: UpdateCommitteeClarificationDto,
  ): Promise<CommitteeClarificationResponseDto> {
    try {
      if (!this.isValidCommitteeType(committeeType)) {
        throw new BadRequestException(
          `Invalid committee type. Must be one of: ${COMMITTEE_TYPES.join(', ')}`,
        );
      }

      const existing = await this.findByGovernanceId(governanceId);

      if (!existing) {
        throw new NotFoundException(
          `Committee clarifications not found for governance ID ${governanceId}`,
        );
      }

      const clarifications = existing.value.clarifications[committeeType];
      if (!clarifications) {
        throw new NotFoundException(
          `Committee type ${committeeType} not found`,
        );
      }

      // Update all clarifications provided in the request
      for (const clarificationUpdate of dto.clarifications) {
        const clarification = clarifications.find(
          (c: any) => c.unique_code === clarificationUpdate.unique_code,
        );

        if (!clarification) {
          throw new NotFoundException(
            `Clarification with code ${clarificationUpdate.unique_code} not found in ${committeeType}`,
          );
        }

        clarification.user_answer =
          clarificationUpdate.user_answer.trim() || 'NOT PROVIDE';
        clarification.status = (clarificationUpdate.status ||
          'completed') as ClarificationStatus;
      }

      const database = this.firebaseConfig.getDatabase();
      const ref = database.ref(`${this.tableName}/${existing.key}`);

      const updatedData = {
        ...existing.value,
        updated_at: new Date().toISOString(),
      };

      await ref.set(updatedData);

      return {
        ...updatedData,
        id: existing.key,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to update committee clarifications',
      );
    }
  }

  async updateClarification(
    governanceId: string,
    committeeType: CommitteeType,
    uniqueCode: string,
    dto: UpdateCommitteeClarificationDto,
  ): Promise<CommitteeClarificationResponseDto> {
    try {
      if (!this.isValidCommitteeType(committeeType)) {
        throw new BadRequestException(
          `Invalid committee type. Must be one of: ${COMMITTEE_TYPES.join(', ')}`,
        );
      }

      const existing = await this.findByGovernanceId(governanceId);

      if (!existing) {
        throw new NotFoundException(
          `Committee clarifications not found for governance ID ${governanceId}`,
        );
      }

      const clarifications = existing.value.clarifications[committeeType];
      if (!clarifications) {
        throw new NotFoundException(
          `Committee type ${committeeType} not found`,
        );
      }

      const clarification = clarifications.find(
        (c: any) => c.unique_code === uniqueCode,
      );

      if (!clarification) {
        throw new NotFoundException(
          `Clarification with code ${uniqueCode} not found in ${committeeType}`,
        );
      }

      clarification.user_answer =
        dto.clarifications[0].user_answer.trim() || 'NOT PROVIDE';
      clarification.status = (dto.clarifications[0].status ||
        'completed') as ClarificationStatus;

      const database = this.firebaseConfig.getDatabase();
      const ref = database.ref(`${this.tableName}/${existing.key}`);

      const updatedData = {
        ...existing.value,
        updated_at: new Date().toISOString(),
      };

      await ref.set(updatedData);

      return {
        ...updatedData,
        id: existing.key,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to update committee clarification',
      );
    }
  }

  async getClarificationsByGovernanceId(
    governanceId: string,
  ): Promise<CommitteeClarificationResponseDto> {
    try {
      const existing = await this.findByGovernanceId(governanceId);

      // Return success with an empty dataset instead of 404 when nothing exists yet
      if (!existing) {
        return {
          governance_id: governanceId,
          user_name: '',
          risk_level: 'low',
          clarifications: {},
          created_at: '',
          updated_at: '',
          id: undefined,
        } as CommitteeClarificationResponseDto;
      }

      return {
        ...existing.value,
        id: existing.key,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to retrieve committee clarifications',
      );
    }
  }
}

import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { FirebaseConfig } from '../config/firebase.config';
import {
  ENV_CLARIFICATION_CODES,
  ENV_CLARIFICATION_DEFINITIONS,
} from './environment-clarifications.constants';
import type {
  EnvClarificationCode,
  EnvClarificationStatus,
} from './environment-clarifications.constants';
import { CreateEnvironmentClarificationDto } from './dto/create-environment-clarification.dto';
import { UpdateEnvironmentClarificationDto } from './dto/update-environment-clarification.dto';
import { EnvironmentClarificationResponseDto } from './dto/environment-clarification-response.dto';

@Injectable()
export class EnvironmentClarificationsService {
  private readonly tableName = 'environment_clarifications';
  private readonly governanceTableName = 'governance_basic_details';

  constructor(private readonly firebaseConfig: FirebaseConfig) {}

  private isValidCode(uniqueCode: string): uniqueCode is EnvClarificationCode {
    return (ENV_CLARIFICATION_CODES as readonly string[]).includes(uniqueCode);
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

  private buildClarifications(
    overrides: CreateEnvironmentClarificationDto['clarifications'] = [],
  ) {
    const overrideMap = new Map<
      EnvClarificationCode,
      { user_answer?: string; status?: EnvClarificationStatus }
    >();

    overrides
      ?.filter((item) => this.isValidCode(item.unique_code))
      .forEach((item) => {
        overrideMap.set(item.unique_code, {
          user_answer: item.user_answer,
          status: item.status,
        });
      });

    return ENV_CLARIFICATION_DEFINITIONS.map((definition) => {
      const override = overrideMap.get(definition.unique_code);
      return {
        clarification: definition.clarification,
        unique_code: definition.unique_code,
        user_answer:
          override?.user_answer?.trim() &&
          override.user_answer.trim().length > 0
            ? override.user_answer.trim()
            : 'NOT PROVIDE',
        status: override?.status || 'pending',
      };
    });
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
    return { key, value: data[key] as EnvironmentClarificationResponseDto };
  }

  async createEnvironmentClarifications(
    dto: CreateEnvironmentClarificationDto,
  ): Promise<EnvironmentClarificationResponseDto> {
    try {
      await this.verifyGovernanceExists(dto.governance_id);

      const existing = await this.findByGovernanceId(dto.governance_id);
      if (existing) {
        throw new ConflictException(
          `Clarifications already exist for governance ID ${dto.governance_id}`,
        );
      }

      const clarifications = this.buildClarifications(dto.clarifications);
      const payload: EnvironmentClarificationResponseDto = {
        governance_id: dto.governance_id,
        user_name: dto.user_name,
        clarifications,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const database = this.firebaseConfig.getDatabase();
      const clarificationsRef = database.ref(this.tableName);
      const newRef = clarificationsRef.push();
      await newRef.set(payload);

      return {
        ...payload,
        id: newRef.key || undefined,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to create environment clarifications: ${error.message}`,
      );
    }
  }

  async updateClarifications(
    governanceId: string,
    dto: UpdateEnvironmentClarificationDto,
  ): Promise<EnvironmentClarificationResponseDto> {
    try {
      await this.verifyGovernanceExists(governanceId);

      const existing = await this.findByGovernanceId(governanceId);
      if (!existing) {
        throw new NotFoundException(
          `Clarifications for governance ID ${governanceId} not found`,
        );
      }

      const updatedClarifications = [...existing.value.clarifications];

      // Update all clarifications provided in the request
      for (const clarificationUpdate of dto.clarifications) {
        const targetIndex = updatedClarifications.findIndex(
          (item) => item.unique_code === clarificationUpdate.unique_code,
        );

        if (targetIndex === -1) {
          throw new NotFoundException(
            `Clarification with code ${clarificationUpdate.unique_code} not found for this governance`,
          );
        }

        updatedClarifications[targetIndex] = {
          ...updatedClarifications[targetIndex],
          user_answer: clarificationUpdate.user_answer.trim(),
          status: clarificationUpdate.status,
        };
      }

      const updatedPayload: EnvironmentClarificationResponseDto = {
        ...existing.value,
        clarifications: updatedClarifications,
        updated_at: new Date().toISOString(),
      };

      const database = this.firebaseConfig.getDatabase();
      const clarificationsRef = database.ref(
        `${this.tableName}/${existing.key}`,
      );
      await clarificationsRef.update(updatedPayload);

      return {
        ...updatedPayload,
        id: existing.key,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to update clarifications: ${error.message}`,
      );
    }
  }

  async updateClarification(
    governanceId: string,
    uniqueCode: string,
    dto: UpdateEnvironmentClarificationDto,
  ): Promise<EnvironmentClarificationResponseDto> {
    try {
      if (!this.isValidCode(uniqueCode)) {
        throw new BadRequestException('Unknown clarification unique code');
      }

      await this.verifyGovernanceExists(governanceId);

      const existing = await this.findByGovernanceId(governanceId);
      if (!existing) {
        throw new NotFoundException(
          `Clarifications for governance ID ${governanceId} not found`,
        );
      }

      const targetIndex = existing.value.clarifications.findIndex(
        (item) => item.unique_code === uniqueCode,
      );

      if (targetIndex === -1) {
        throw new NotFoundException(
          `Clarification with code ${uniqueCode} not found for this governance`,
        );
      }

      const updatedClarifications = [...existing.value.clarifications];
      updatedClarifications[targetIndex] = {
        ...updatedClarifications[targetIndex],
        user_answer: dto.clarifications[0].user_answer.trim(),
        status: dto.clarifications[0].status,
      };

      const updatedPayload: EnvironmentClarificationResponseDto = {
        ...existing.value,
        clarifications: updatedClarifications,
        updated_at: new Date().toISOString(),
      };

      const database = this.firebaseConfig.getDatabase();
      const clarificationsRef = database.ref(
        `${this.tableName}/${existing.key}`,
      );
      await clarificationsRef.update(updatedPayload);

      return {
        ...updatedPayload,
        id: existing.key,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to update environment clarification: ${error.message}`,
      );
    }
  }

  async getClarificationsByGovernanceId(
    governanceId: string,
  ): Promise<EnvironmentClarificationResponseDto> {
    try {
      const existing = await this.findByGovernanceId(governanceId);
      if (!existing) {
        throw new NotFoundException(
          `Clarifications for governance ID ${governanceId} not found`,
        );
      }

      return {
        ...existing.value,
        id: existing.key,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to fetch environment clarifications: ${error.message}`,
      );
    }
  }
}

import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { FirebaseConfig } from '../config/firebase.config';
import { CreateEnvironmentDetailsDto } from './dto/create-environment-details.dto';
import { EnvironmentDetailsResponseDto } from './dto/environment-details-response.dto';

@Injectable()
export class EnvironmentDetailsService {
  private readonly tableName = 'environment_details';
  private readonly governanceTableName = 'governance_basic_details';

  constructor(private readonly firebaseConfig: FirebaseConfig) {}

  private async generateEnvironmentDetailsId(): Promise<string> {
    const database = this.firebaseConfig.getDatabase();
    const envRef = database.ref(this.tableName);
    const snapshot = await envRef.once('value');
    const data = snapshot.val();

    if (!data) {
      return 'ENV0001';
    }

    // Get all environment details IDs and find the highest number
    const ids = Object.values(data).map(
      (item: any) => item.environment_details_id,
    );
    const numbers = ids
      .map((id: string) => parseInt(id.replace('ENV', ''), 10))
      .filter((num) => !isNaN(num));

    const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
    const nextNumber = maxNumber + 1;

    return `ENV${nextNumber.toString().padStart(4, '0')}`;
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

  async createEnvironmentDetails(
    createEnvironmentDetailsDto: CreateEnvironmentDetailsDto,
  ): Promise<EnvironmentDetailsResponseDto> {
    try {
      // Verify governance exists
      await this.verifyGovernanceExists(
        createEnvironmentDetailsDto.governance_id,
      );

      // Generate environment details ID
      const environment_details_id = await this.generateEnvironmentDetailsId();

      // Create environment details data
      const environmentDetailsData = {
        environment_details_id,
        user_name: createEnvironmentDetailsDto.user_name,
        governance_id: createEnvironmentDetailsDto.governance_id,
        environment: createEnvironmentDetailsDto.environment,
        region: createEnvironmentDetailsDto.region,
        environment_breakdown:
          createEnvironmentDetailsDto.environment_breakdown,
        created_at: new Date().toISOString(),
      };

      // Save to Firebase
      const database = this.firebaseConfig.getDatabase();
      const envRef = database.ref(this.tableName);
      const newEnvRef = envRef.push();
      await newEnvRef.set(environmentDetailsData);

      return {
        environment_details_id: environmentDetailsData.environment_details_id,
        user_name: environmentDetailsData.user_name,
        governance_id: environmentDetailsData.governance_id,
        environment: environmentDetailsData.environment,
        region: environmentDetailsData.region,
        environment_breakdown: environmentDetailsData.environment_breakdown,
        created_at: environmentDetailsData.created_at,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to create environment details: ${error.message}`,
      );
    }
  }

  async getAllEnvironmentDetails(): Promise<EnvironmentDetailsResponseDto[]> {
    try {
      const database = this.firebaseConfig.getDatabase();
      const envRef = database.ref(this.tableName);

      const snapshot = await envRef.once('value');
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
        `Failed to fetch environment details: ${error.message}`,
      );
    }
  }

  async getEnvironmentDetailsById(
    environmentDetailsId: string,
  ): Promise<EnvironmentDetailsResponseDto | null> {
    try {
      const database = this.firebaseConfig.getDatabase();
      const envRef = database.ref(this.tableName);

      const snapshot = await envRef
        .orderByChild('environment_details_id')
        .equalTo(environmentDetailsId)
        .once('value');

      const data = snapshot.val();

      if (!data) {
        return null;
      }

      // Return the first (and should be only) matching environment details
      const envKey = Object.keys(data)[0];
      return {
        ...data[envKey],
        id: envKey,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to fetch environment details: ${error.message}`,
      );
    }
  }

  async getEnvironmentDetailsByGovernanceId(
    governanceId: string,
  ): Promise<EnvironmentDetailsResponseDto[]> {
    try {
      const database = this.firebaseConfig.getDatabase();
      const envRef = database.ref(this.tableName);

      const snapshot = await envRef
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
        `Failed to fetch environment details by governance ID: ${error.message}`,
      );
    }
  }
}

import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { FirebaseConfig } from '../config/firebase.config';
import { CreateCostDetailsDto } from './dto/create-cost-details.dto';
import { CostDetailsResponseDto } from './dto/cost-details-response.dto';

@Injectable()
export class CostDetailsService {
  private readonly tableName = 'cost_details';
  private readonly governanceTableName = 'governance_basic_details';

  constructor(private readonly firebaseConfig: FirebaseConfig) {}

  private async generateCostDetailsId(): Promise<string> {
    const database = this.firebaseConfig.getDatabase();
    const costRef = database.ref(this.tableName);
    const snapshot = await costRef.once('value');
    const data = snapshot.val();

    if (!data) {
      return 'COST0001';
    }

    // Get all cost details IDs and find the highest number
    const ids = Object.values(data).map((item: any) => item.cost_details_id);
    const numbers = ids
      .map((id: string) => parseInt(id.replace('COST', ''), 10))
      .filter((num) => !isNaN(num));

    const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
    const nextNumber = maxNumber + 1;

    return `COST${nextNumber.toString().padStart(4, '0')}`;
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

  async createCostDetails(
    createCostDetailsDto: CreateCostDetailsDto,
  ): Promise<CostDetailsResponseDto> {
    try {
      // Verify governance exists
      await this.verifyGovernanceExists(createCostDetailsDto.governance_id);

      // Generate cost details ID
      const cost_details_id = await this.generateCostDetailsId();

      // Clean cost breakdown to remove undefined values
      const cleanCostBreakdown = createCostDetailsDto.cost_breakdown.map(
        (item) => {
          const cleanItem: any = {
            category: item.category,
            description: item.description,
            amount: item.amount,
          };
          if (item.notes !== undefined && item.notes !== null) {
            cleanItem.notes = item.notes;
          }
          return cleanItem;
        },
      );

      // Create cost details data
      const costDetailsData = {
        cost_details_id,
        user_name: createCostDetailsDto.user_name,
        governance_id: createCostDetailsDto.governance_id,
        total_estimated_cost: createCostDetailsDto.total_estimated_cost,
        cost_breakdown: cleanCostBreakdown,
        created_at: new Date().toISOString(),
      };

      // Save to Firebase
      const database = this.firebaseConfig.getDatabase();
      const costRef = database.ref(this.tableName);
      const newCostRef = costRef.push();
      await newCostRef.set(costDetailsData);

      return {
        cost_details_id: costDetailsData.cost_details_id,
        user_name: costDetailsData.user_name,
        governance_id: costDetailsData.governance_id,
        total_estimated_cost: costDetailsData.total_estimated_cost,
        cost_breakdown: costDetailsData.cost_breakdown,
        created_at: costDetailsData.created_at,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to create cost details: ${error.message}`,
      );
    }
  }

  async getAllCostDetails(): Promise<CostDetailsResponseDto[]> {
    try {
      const database = this.firebaseConfig.getDatabase();
      const costRef = database.ref(this.tableName);

      const snapshot = await costRef.once('value');
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
        `Failed to fetch cost details: ${error.message}`,
      );
    }
  }

  async getCostDetailsById(
    costDetailsId: string,
  ): Promise<CostDetailsResponseDto | null> {
    try {
      const database = this.firebaseConfig.getDatabase();
      const costRef = database.ref(this.tableName);

      const snapshot = await costRef
        .orderByChild('cost_details_id')
        .equalTo(costDetailsId)
        .once('value');

      const data = snapshot.val();

      if (!data) {
        return null;
      }

      // Return the first (and should be only) matching cost details
      const costKey = Object.keys(data)[0];
      return {
        ...data[costKey],
        id: costKey,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to fetch cost details: ${error.message}`,
      );
    }
  }

  async getCostDetailsByGovernanceId(
    governanceId: string,
  ): Promise<CostDetailsResponseDto[]> {
    try {
      const database = this.firebaseConfig.getDatabase();
      const costRef = database.ref(this.tableName);

      const snapshot = await costRef
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
        `Failed to fetch cost details by governance ID: ${error.message}`,
      );
    }
  }
}

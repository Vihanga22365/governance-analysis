import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface CostDetail {
  category: string;
  description: string;
  amount: string;
}

interface Clarification {
  clarification: string;
  status: 'pending' | 'completed';
  unique_code: string;
  user_answer: string;
}

interface CostClarificationResponse {
  message: string;
  governanceId: string;
  data: {
    clarifications: Clarification[];
    created_at: string;
    governance_id: string;
    updated_at: string;
    user_name: string;
    id: string;
  };
}

@Component({
  selector: 'app-cost-details',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './cost-details.component.html',
  styleUrls: ['./cost-details.component.scss'],
})
export class CostDetailsComponent implements OnInit, OnChanges {
  @Input() isDarkTheme: boolean = false;
  @Input() costDetails: CostDetail[] = [];
  @Input() totalCost: string = '';
  @Input() isExecutingAgents: boolean = false;
  @Input() governanceId: string = '';
  @Input() costClarifications: Clarification[] = [];

  private apiBaseUrl = environment.backendApiUrl;
  pendingClarifications: Clarification[] = [];
  isLoadingClarifications: boolean = false;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    if (this.governanceId && !this.costClarifications?.length) {
      this.fetchCostClarifications();
    } else if (this.costClarifications?.length) {
      this.updatePendingClarifications();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['governanceId'] &&
      this.governanceId &&
      !this.costClarifications?.length
    ) {
      this.fetchCostClarifications();
    }
    if (changes['costClarifications'] && this.costClarifications?.length) {
      this.updatePendingClarifications();
    }
  }

  /**
   * Fetch cost clarifications from backend
   */
  private async fetchCostClarifications(): Promise<void> {
    if (!this.governanceId) return;

    this.isLoadingClarifications = true;
    try {
      const response = await this.http
        .get<CostClarificationResponse>(
          `${this.apiBaseUrl}/cost-clarifications/governance/${this.governanceId}`
        )
        .toPromise();

      if (response?.data?.clarifications) {
        // Filter only pending clarifications
        this.pendingClarifications = response.data.clarifications.filter(
          (c) => c.status === 'pending'
        );
        console.log('Fetched cost clarifications:', this.pendingClarifications);
      }
    } catch (error: any) {
      console.error('Error fetching cost clarifications:', error);
      // If no clarifications exist yet, that's okay - just keep empty array
      this.pendingClarifications = [];
    } finally {
      this.isLoadingClarifications = false;
    }
  }

  /**
   * Update pending clarifications from input
   */
  private updatePendingClarifications(): void {
    if (this.costClarifications?.length) {
      this.pendingClarifications = this.costClarifications.filter(
        (c) => c.status === 'pending'
      );
    }
  }

  /**
   * Get pending clarifications for display
   */
  getPendingClarifications(): Clarification[] {
    return this.pendingClarifications;
  }

  /**
   * Check if all clarifications are completed
   */
  getAllClarificationsCompleted(): boolean {
    if (!this.costClarifications || this.costClarifications.length === 0) {
      return false;
    }
    // All clarifications are completed if none are pending
    return this.costClarifications.every((c) => c.status === 'completed');
  }
}

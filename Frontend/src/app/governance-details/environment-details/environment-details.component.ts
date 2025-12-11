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

interface ServiceDetail {
  service: string;
  reason: string;
}

interface EnvironmentDetail {
  provider: string;
  region: string;
  status: string;
  services: ServiceDetail[];
}

interface Clarification {
  clarification: string;
  status: 'pending' | 'completed';
  unique_code: string;
  user_answer: string;
}

interface EnvironmentClarificationResponse {
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
  selector: 'app-environment-details',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './environment-details.component.html',
  styleUrls: ['./environment-details.component.scss'],
})
export class EnvironmentDetailsComponent implements OnInit, OnChanges {
  @Input() isDarkTheme: boolean = false;
  @Input() environmentDetails: EnvironmentDetail[] = [];
  @Input() isExecutingAgents: boolean = false;
  @Input() governanceId: string = '';
  @Input() environmentClarifications: Clarification[] = [];

  private apiBaseUrl = environment.backendApiUrl;
  pendingClarifications: Clarification[] = [];
  isLoadingClarifications: boolean = false;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    if (this.governanceId && !this.environmentClarifications?.length) {
      this.fetchEnvironmentClarifications();
    } else if (this.environmentClarifications?.length) {
      this.updatePendingClarifications();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['governanceId'] &&
      this.governanceId &&
      !this.environmentClarifications?.length
    ) {
      this.fetchEnvironmentClarifications();
    }
    if (
      changes['environmentClarifications'] &&
      this.environmentClarifications?.length
    ) {
      this.updatePendingClarifications();
    }
  }

  /**
   * Fetch environment clarifications from backend
   */
  private async fetchEnvironmentClarifications(): Promise<void> {
    if (!this.governanceId) return;

    this.isLoadingClarifications = true;
    try {
      const response = await this.http
        .get<EnvironmentClarificationResponse>(
          `${this.apiBaseUrl}/environment-clarifications/governance/${this.governanceId}`
        )
        .toPromise();

      if (response?.data?.clarifications) {
        // Filter only pending clarifications
        this.pendingClarifications = response.data.clarifications.filter(
          (c) => c.status === 'pending'
        );
        console.log(
          'Fetched environment clarifications:',
          this.pendingClarifications
        );
      }
    } catch (error: any) {
      console.error('Error fetching environment clarifications:', error);
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
    if (this.environmentClarifications?.length) {
      this.pendingClarifications = this.environmentClarifications.filter(
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
    if (
      !this.environmentClarifications ||
      this.environmentClarifications.length === 0
    ) {
      return false;
    }
    // All clarifications are completed if none are pending
    return this.environmentClarifications.every(
      (c) => c.status === 'completed'
    );
  }
}

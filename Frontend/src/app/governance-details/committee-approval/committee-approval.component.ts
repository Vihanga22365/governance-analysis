import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../../../environments/environment';

type CommitteeStatus = 'Pending' | 'Approved' | 'Rejected' | 'Not Needed';

interface Committee {
  name: string;
  role: string;
  status: CommitteeStatus;
  committeeNumber: 1 | 2 | 3;
}

interface Notification {
  type: 'success' | 'error' | 'warning';
  message: string;
  visible: boolean;
}

@Component({
  selector: 'app-committee-approval',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './committee-approval.component.html',
  styleUrls: ['./committee-approval.component.scss'],
})
export class CommitteeApprovalComponent implements OnInit {
  @Input() committees: Committee[] = [];
  @Input() requiredCommittees: number = 0;
  @Input() riskLevel: string = '';
  @Input() governanceId: string = '';

  private apiBaseUrl = environment.backendApiUrl;
  isUpdating = false;

  notification: Notification = {
    type: 'success',
    message: '',
    visible: false,
  };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    console.log('Committee component initialized with:', {
      committees: this.committees,
      governanceId: this.governanceId,
      riskLevel: this.riskLevel,
    });
  }

  showNotification(
    type: 'success' | 'error' | 'warning',
    message: string
  ): void {
    this.notification = { type, message, visible: true };

    // Auto-hide after 4 seconds
    setTimeout(() => {
      this.hideNotification();
    }, 4000);
  }

  hideNotification(): void {
    this.notification.visible = false;
  }

  canApprove(committee: Committee): boolean {
    // Cannot update if "Not Needed"
    if (committee.status === 'Not Needed') return false;
    // Cannot update if already "Approved"
    if (committee.status === 'Approved') return false;
    // Can approve from "Pending" or "Rejected"
    return true;
  }

  canReject(committee: Committee): boolean {
    // Cannot update if "Not Needed"
    if (committee.status === 'Not Needed') return false;
    // Cannot update if already "Approved"
    if (committee.status === 'Approved') return false;
    // Can reject from "Pending" or already "Rejected"
    return true;
  }

  async updateCommitteeStatus(
    committee: Committee,
    newStatus: 'Approved' | 'Rejected'
  ): Promise<void> {
    if (!this.governanceId) {
      console.error('No governance ID provided');
      this.showNotification('error', 'Cannot update: No governance ID found');
      return;
    }

    // Check if update is allowed
    if (committee.status === 'Not Needed') {
      this.showNotification(
        'warning',
        'This committee approval is not needed for this risk level'
      );
      return;
    }

    if (committee.status === 'Approved') {
      this.showNotification(
        'warning',
        'This committee has already approved and the status cannot be changed'
      );
      return;
    }

    this.isUpdating = true;

    try {
      const updatePayload: any = {
        governance_id: this.governanceId,
      };

      // Set the appropriate committee status
      const committeeKey = `committee_${committee.committeeNumber}`;
      updatePayload[committeeKey] = newStatus;

      console.log('Updating committee status:', updatePayload);

      const response = await this.http
        .put<any>(
          `${this.apiBaseUrl}/risk-analyse/update-committee`,
          updatePayload
        )
        .toPromise();

      console.log('Committee status updated:', response);

      // Update local status
      committee.status = newStatus;

      this.showNotification(
        'success',
        `${committee.name} successfully ${newStatus.toLowerCase()}`
      );
    } catch (error: any) {
      console.error('Error updating committee status:', error);
      const errorMessage =
        error.error?.message || 'Failed to update committee status';
      this.showNotification('error', errorMessage);
    } finally {
      this.isUpdating = false;
    }
  }
}

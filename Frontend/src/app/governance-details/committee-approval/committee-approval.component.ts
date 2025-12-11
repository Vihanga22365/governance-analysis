import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ChatbotService } from '../../services/chatbot.service';
import { ApiConfigService } from '../../services/api-config.service';

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
export class CommitteeApprovalComponent implements OnInit, OnChanges {
  @Input() isDarkTheme: boolean = false;
  @Input() committees: Committee[] = [];
  @Input() requiredCommittees: number = 0;
  @Input() riskLevel: string = '';
  @Input() governanceId: string = '';
  @Input() committeeClarifications: any = {};
  @Input() autoSelectedCommittee: 1 | 2 | 3 | null = null;
  @Output() agentsStarted = new EventEmitter<void>();
  @Output() agentsCompleted = new EventEmitter<void>();
  @Output() agentsError = new EventEmitter<void>();

  private apiBaseUrl = environment.backendApiUrl;
  isUpdating = false;
  isExecutingAgents = false;
  private sessionId: string = '';
  private sessionCreated = false;
  selectedCommitteeNumber: 1 | 2 | 3 = 1;

  notification: Notification = {
    type: 'success',
    message: '',
    visible: false,
  };

  constructor(
    private http: HttpClient,
    private chatbotService: ChatbotService,
    private apiConfig: ApiConfigService
  ) {}

  ngOnInit(): void {
    console.log('Committee component initialized with:', {
      committees: this.committees,
      governanceId: this.governanceId,
      riskLevel: this.riskLevel,
      autoSelectedCommittee: this.autoSelectedCommittee,
    });
    this.sessionId = this.generateUUID();

    // Auto-select committee if provided
    this.handleAutoSelection();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Handle changes to autoSelectedCommittee input
    if (changes['autoSelectedCommittee']) {
      console.log('autoSelectedCommittee changed:', {
        previous: changes['autoSelectedCommittee'].previousValue,
        current: changes['autoSelectedCommittee'].currentValue,
        firstChange: changes['autoSelectedCommittee'].firstChange,
      });
      this.handleAutoSelection();
    }

    // Also check when committees array changes
    if (changes['committees'] && this.autoSelectedCommittee) {
      console.log('Committees changed, re-applying auto-selection');
      this.handleAutoSelection();
    }
  }

  private handleAutoSelection(): void {
    if (
      this.autoSelectedCommittee &&
      [1, 2, 3].includes(this.autoSelectedCommittee)
    ) {
      this.selectedCommitteeNumber = this.autoSelectedCommittee;
      console.log(
        `Auto-selected committee ${this.autoSelectedCommittee} from WebSocket response`
      );
    }
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

  selectCommittee(committeeNumber: 1 | 2 | 3): void {
    this.selectedCommitteeNumber = committeeNumber;
  }

  getSelectedCommittee(): Committee | undefined {
    return this.committees.find(
      (c) => c.committeeNumber === this.selectedCommitteeNumber
    );
  }

  getVisibleCommittees(): Committee[] {
    const riskLower = this.riskLevel.toLowerCase();
    if (riskLower === 'low') {
      return this.committees.filter(
        (c) => c.committeeNumber === 1 && c.status !== 'Not Needed'
      );
    } else if (riskLower === 'medium') {
      return this.committees.filter(
        (c) =>
          (c.committeeNumber === 1 || c.committeeNumber === 2) &&
          c.status !== 'Not Needed'
      );
    } else if (riskLower === 'high') {
      return this.committees.filter((c) => c.status !== 'Not Needed');
    }
    return [];
  }

  getPendingClarifications(): Array<{
    clarification: string;
    unique_code: string;
    status: string;
  }> {
    const selected = this.getSelectedCommittee();
    if (!selected || !this.committeeClarifications) {
      return [];
    }

    const committeeKey = `committee_${selected.committeeNumber}`;
    const committeeData = this.committeeClarifications[committeeKey];

    if (!Array.isArray(committeeData)) {
      return [];
    }

    // Filter for pending items (status === 'pending' and user_answer === 'NOT PROVIDE')
    return committeeData.filter(
      (item: any) =>
        item.status === 'pending' && item.user_answer === 'NOT PROVIDE'
    );
  }

  hasPendingClarifications(): boolean {
    return this.getPendingClarifications().length > 0;
  }

  getAllClarificationsCompleted(): boolean {
    const selected = this.getSelectedCommittee();
    if (!selected || !this.committeeClarifications) {
      return false;
    }

    const committeeKey = `committee_${selected.committeeNumber}`;
    const committeeData = this.committeeClarifications[committeeKey];

    if (!Array.isArray(committeeData) || committeeData.length === 0) {
      return false;
    }

    // All clarifications are completed if all have answers (not 'NOT PROVIDE')
    return committeeData.every(
      (item: any) => item.user_answer !== 'NOT PROVIDE'
    );
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

      // Check if all required committees are approved after updating
      if (this.areAllRequiredCommitteesApproved()) {
        console.log('All required committees approved, triggering agents...');
        this.triggerAgents();
      }
    } catch (error: any) {
      console.error('Error updating committee status:', error);
      const errorMessage =
        error.error?.message || 'Failed to update committee status';
      this.showNotification('error', errorMessage);
    } finally {
      this.isUpdating = false;
    }
  }

  /**
   * Check if all required committees are approved
   */
  private areAllRequiredCommitteesApproved(): boolean {
    const requiredCommittees = this.committees.filter(
      (c) => c.status !== 'Not Needed'
    );

    if (requiredCommittees.length === 0) {
      return false;
    }

    return requiredCommittees.every((c) => c.status === 'Approved');
  }

  /**
   * Trigger agents by creating session and sending message
   */
  private triggerAgents(): void {
    if (!this.governanceId) {
      console.error('Cannot trigger agents: No governance ID');
      return;
    }

    // First create the clarifications
    this.createClarifications();

    // Create session first if not already created
    if (!this.sessionCreated) {
      this.chatbotService
        .createSession(
          this.sessionId,
          this.apiConfig.getUserId(),
          'Automated Process'
        )
        .subscribe({
          next: (response) => {
            console.log('Session created successfully:', response);
            this.sessionCreated = true;
            this.sendAgentMessage();
          },
          error: (error) => {
            console.error('Failed to create session:', error);
            this.showNotification(
              'error',
              'Failed to create session for agents'
            );
          },
        });
    } else {
      this.sendAgentMessage();
    }
  }

  /**
   * Create cost and environment clarifications
   */
  private async createClarifications(): Promise<void> {
    try {
      // Create cost clarifications
      const costPayload = {
        governance_id: this.governanceId,
        user_name: this.apiConfig.getUserId() || 'System User',
        clarifications: [],
      };

      await this.http
        .post(`${this.apiBaseUrl}/cost-clarifications`, costPayload)
        .toPromise();

      console.log('Cost clarifications created successfully');

      // Create environment clarifications
      const envPayload = {
        governance_id: this.governanceId,
        user_name: this.apiConfig.getUserId() || 'System User',
        clarifications: [],
      };

      await this.http
        .post(`${this.apiBaseUrl}/environment-clarifications`, envPayload)
        .toPromise();

      console.log('Environment clarifications created successfully');
    } catch (error) {
      console.error('Error creating clarifications:', error);
      // Don't fail the whole process if clarifications fail
    }
  }

  /**
   * Send message to trigger environment and cost agents
   */
  private sendAgentMessage(): void {
    const message = `<from_system>
<governance_request_id>${this.governanceId}</governance_request_id>
execute tools and then execute environment agent and cost agent
</from_system>`;

    console.log('Sending agent message:', message);

    this.isExecutingAgents = true;
    this.agentsStarted.emit();

    this.chatbotService.sendMessage(this.sessionId, message).subscribe({
      next: (response) => {
        console.log('Agent execution response:', response);
        this.isExecutingAgents = false;
        this.showNotification(
          'success',
          'Environment and Cost agents executed successfully'
        );
        // Emit event to parent to refresh all governance details
        this.agentsCompleted.emit();
      },
      error: (error) => {
        console.error('Failed to trigger agents:', error);
        this.isExecutingAgents = false;
        this.showNotification('error', 'Failed to execute agents');
        this.agentsError.emit();
      },
    });
  }

  /**
   * Generate UUID for session ID
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}

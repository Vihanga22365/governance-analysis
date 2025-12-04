import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgClass, NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ChatHistoryComponent } from './chat-history/chat-history.component';
import { GovernanceReportComponent } from './governance-report/governance-report.component';
import { RiskLevelComponent } from './risk-level/risk-level.component';
import { CommitteeApprovalComponent } from './committee-approval/committee-approval.component';
import { CostDetailsComponent } from './cost-details/cost-details.component';
import { EnvironmentDetailsComponent } from './environment-details/environment-details.component';
import { ChatHistoryWebsocketService } from '../services/chat-history-websocket.service';
import {
  GovernanceService,
  SearchResultItem,
} from '../services/governance.service';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { environment } from '../../environments/environment';

interface ChatMessage {
  author: string;
  timestamp: string;
  text: string;
  type: 'incoming' | 'outgoing';
  attachments?: Array<{
    id: number;
    name: string;
    sizeLabel: string;
    file?: File;
  }>;
}

type CommitteeStatus = 'Pending' | 'Approved' | 'Rejected' | 'Not Needed';

interface Committee {
  name: string;
  role: string;
  status: CommitteeStatus;
  committeeNumber: 1 | 2 | 3;
}

interface GovernanceReport {
  title: string;
  summary: string;
  recommendations: string[];
  documents: Array<{
    id: number;
    name: string;
    sizeLabel: string;
    url?: string;
  }>;
}

type RiskLevel = 'Low' | 'Medium' | 'High';

interface CostDetail {
  category: string;
  amount: string;
  description: string;
}

interface ServiceDetail {
  service: string;
  reason: string;
}

interface EnvironmentDetail {
  provider: 'AWS' | 'GCP' | 'Azure';
  region: string;
  services: ServiceDetail[];
  status: string;
}

type SectionType =
  | 'history'
  | 'report'
  | 'risk'
  | 'committee'
  | 'cost'
  | 'environment';

@Component({
  selector: 'app-governance-details',
  standalone: true,
  imports: [
    NgClass,
    NgIf,
    NgFor,
    FormsModule,
    HttpClientModule,
    ChatHistoryComponent,
    GovernanceReportComponent,
    RiskLevelComponent,
    CommitteeApprovalComponent,
    CostDetailsComponent,
    EnvironmentDetailsComponent,
  ],
  templateUrl: './governance-details.component.html',
  styleUrl: './governance-details.component.scss',
})
export class GovernanceDetailsComponent implements OnInit, OnDestroy {
  activeSection: SectionType = 'history';
  private chatHistorySubscription?: Subscription;
  private governanceDetailsSubscription?: Subscription;
  latestChatHistoryPayload: any = null;
  latestGovernanceDetailsPayload: any = null;

  // Search properties
  searchGovernanceId: string = '';
  isSearching: boolean = false;
  isLoading: boolean = false;
  searchError: string = '';
  currentGovernanceId: string = '';
  isExecutingAgents: boolean = false;

  // Search dropdown properties
  showSearchDropdown: boolean = false;
  searchResults: SearchResultItem[] = [];
  isSearchingDropdown: boolean = false;
  selectedSearchIndex: number = -1;
  private searchSubject = new Subject<string>();

  // Chat History - no dummy data
  chatHistory: ChatMessage[] = [];

  // Governance Report - no dummy data
  governanceReport: GovernanceReport = {
    title: '',
    summary: '',
    recommendations: [],
    documents: [],
  };

  // Risk Level - no dummy data
  riskLevel: RiskLevel = 'Low';
  riskReason: string = '';

  // Committee Approvals - no dummy data
  committees: Committee[] = [];

  // Cost Details - no dummy data
  costDetails: CostDetail[] = [];

  // Environment Details - no dummy data
  environmentDetails: EnvironmentDetail[] = [];

  constructor(
    private chatHistoryWebsocket: ChatHistoryWebsocketService,
    private governanceService: GovernanceService
  ) {}

  ngOnInit(): void {
    // Subscribe to real-time chat history updates from MCP Server
    this.chatHistorySubscription = this.chatHistoryWebsocket
      .getChatHistoryUpdates()
      .subscribe({
        next: (data) => {
          console.log('Governance Details received chat history update:', data);
          this.updateChatHistoryFromWebSocket(data);
        },
        error: (error) => {
          console.error(
            'Error in governance details chat history subscription:',
            error
          );
        },
      });

    // Subscribe to governance details updates from MCP Server
    this.governanceDetailsSubscription = this.chatHistoryWebsocket
      .getGovernanceDetailsUpdates()
      .subscribe({
        next: (data) => {
          console.log(
            'Governance Details received governance details update:',
            data
          );
          this.updateGovernanceDetailsFromWebSocket(data);
        },
        error: (error) => {
          console.error('Error in governance details subscription:', error);
        },
      });

    // Setup search autocomplete with debounce
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((searchTerm) => {
          if (!searchTerm || searchTerm.trim().length < 2) {
            this.showSearchDropdown = false;
            this.searchResults = [];
            return [];
          }
          this.isSearchingDropdown = true;
          return this.governanceService.searchGovernance(searchTerm.trim());
        })
      )
      .subscribe({
        next: (response) => {
          this.searchResults = response.data || [];
          this.showSearchDropdown = this.searchResults.length > 0;
          this.isSearchingDropdown = false;
          this.selectedSearchIndex = -1;
        },
        error: (error) => {
          console.error('Search error:', error);
          this.isSearchingDropdown = false;
          this.showSearchDropdown = false;
          this.searchResults = [];
        },
      });
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    if (this.chatHistorySubscription) {
      this.chatHistorySubscription.unsubscribe();
    }
    if (this.governanceDetailsSubscription) {
      this.governanceDetailsSubscription.unsubscribe();
    }
  }

  /**
   * Update chat history from WebSocket data
   */
  private updateChatHistoryFromWebSocket(data: any): void {
    // Store the raw payload for debugging
    this.latestChatHistoryPayload = data;

    // Transform the data to match the ChatMessage interface
    if (Array.isArray(data)) {
      this.chatHistory = data;
    } else if (data.messages && Array.isArray(data.messages)) {
      this.chatHistory = data.messages;
    } else if (data.chatHistory && Array.isArray(data.chatHistory)) {
      this.chatHistory = data.chatHistory;
    } else {
      // Handle single message update
      console.log('Single message received, adding to chat history');
    }
  }

  /**
   * Update governance details from WebSocket data
   */
  private updateGovernanceDetailsFromWebSocket(data: any): void {
    // Store the raw payload for debugging
    this.latestGovernanceDetailsPayload = data;

    console.log('Updating governance details with data:', data);

    // Update governance report if available
    if (
      data.governance_report?.data &&
      Array.isArray(data.governance_report.data) &&
      data.governance_report.data.length > 0
    ) {
      const report = data.governance_report.data[0];

      // Transform documents from API response
      const documents = (report.documents || []).map(
        (docPath: string, index: number) => {
          const fileName =
            docPath
              .split(/[\\\/]/)
              .pop()
              ?.replace(/^\d+-/, '') || docPath;

          // Normalize path: replace backslashes with forward slashes
          let normalizedPath = docPath.replace(/\\/g, '/');

          // Remove 'documents/' prefix if present (for backward compatibility)
          if (normalizedPath.startsWith('documents/')) {
            normalizedPath = normalizedPath.substring('documents/'.length);
          }

          return {
            id: index + 1,
            name: fileName,
            sizeLabel: 'PDF Document',
            url: `${environment.backendBaseUrl}/documents/${normalizedPath}`,
          };
        }
      );

      this.governanceReport = {
        title: `Governance Report - ${data.governance_id || ''}`,
        summary: report.report_content || 'No summary available',
        recommendations: [],
        documents: documents,
      };
      console.log('Updated governance report:', this.governanceReport);
    }

    // Update risk details if available
    if (
      data.risk_details?.data &&
      Array.isArray(data.risk_details.data) &&
      data.risk_details.data.length > 0
    ) {
      const risk = data.risk_details.data[0];
      // Map risk_level to proper case
      const riskLevelMap: { [key: string]: RiskLevel } = {
        low: 'Low',
        medium: 'Medium',
        high: 'High',
      };
      this.riskLevel = riskLevelMap[risk.risk_level?.toLowerCase()] || 'Low';
      this.riskReason = risk.reason || 'No reason provided';

      // Update committees based on risk level and approval status
      this.updateCommitteesFromRiskData(risk);
      console.log(
        'Updated risk level:',
        this.riskLevel,
        'Reason:',
        this.riskReason
      );
    }

    // Update cost details if available
    if (
      data.cost_details?.data &&
      Array.isArray(data.cost_details.data) &&
      data.cost_details.data.length > 0
    ) {
      const costData = data.cost_details.data[0];
      if (costData.cost_breakdown && Array.isArray(costData.cost_breakdown)) {
        this.costDetails = costData.cost_breakdown.map((item: any) => ({
          category: item.category || 'Unknown',
          amount: `$${item.amount?.toLocaleString() || '0'}`,
          description: item.description || '',
        }));
      }
      console.log('Updated cost details:', this.costDetails);
    }

    // Update environment details if available
    if (
      data.environment_details?.data &&
      Array.isArray(data.environment_details.data) &&
      data.environment_details.data.length > 0
    ) {
      this.environmentDetails = data.environment_details.data.map(
        (env: any) => ({
          provider: env.environment?.toUpperCase() || 'Unknown',
          region: env.region || 'N/A',
          services: env.environment_breakdown || [],
          status: 'Active',
        })
      );
      console.log('Updated environment details:', this.environmentDetails);
    }
  }

  /**
   * Update committee approvals based on risk data
   */
  private updateCommitteesFromRiskData(riskData: any): void {
    const committees: Committee[] = [];

    // Map committee statuses
    const statusMap: { [key: string]: CommitteeStatus } = {
      Approved: 'Approved',
      Rejected: 'Rejected',
      Pending: 'Pending',
      'Not Needed': 'Pending',
    };

    if (riskData.committee_1 && riskData.committee_1 !== 'Not Needed') {
      committees.push({
        name: 'Security Committee',
        role: 'CISO Approval',
        status: statusMap[riskData.committee_1] || 'Pending',
        committeeNumber: 1,
      });
    }

    if (riskData.committee_2 && riskData.committee_2 !== 'Not Needed') {
      committees.push({
        name: 'Operations Board',
        role: 'CTO Approval',
        status: statusMap[riskData.committee_2] || 'Pending',
        committeeNumber: 2,
      });
    }

    if (riskData.committee_3 && riskData.committee_3 !== 'Not Needed') {
      committees.push({
        name: 'Executive Committee',
        role: 'CEO Approval',
        status: statusMap[riskData.committee_3] || 'Pending',
        committeeNumber: 3,
      });
    }

    this.committees = committees;
  }

  /**
   * Clear all data from components
   */
  private clearAllData(): void {
    this.governanceReport = {
      title: '',
      summary: '',
      recommendations: [],
      documents: [],
    };
    this.riskLevel = 'Low';
    this.riskReason = '';
    this.committees = [];
    this.costDetails = [];
    this.environmentDetails = [];
  }

  /**
   * Handle search input change for autocomplete
   */
  onSearchInput(searchTerm: string): void {
    this.searchSubject.next(searchTerm);
  }

  /**
   * Select a search result from dropdown
   */
  selectSearchResult(result: SearchResultItem): void {
    this.searchGovernanceId = result.governance_id;
    this.showSearchDropdown = false;
    this.searchResults = [];
    this.selectedSearchIndex = -1;
    // Automatically trigger search
    this.searchGovernanceDetails();
  }

  /**
   * Handle keyboard navigation in dropdown
   */
  onSearchKeydown(event: KeyboardEvent): void {
    if (!this.showSearchDropdown || this.searchResults.length === 0) {
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.selectedSearchIndex = Math.min(
          this.selectedSearchIndex + 1,
          this.searchResults.length - 1
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.selectedSearchIndex = Math.max(this.selectedSearchIndex - 1, -1);
        break;
      case 'Enter':
        event.preventDefault();
        if (this.selectedSearchIndex >= 0) {
          this.selectSearchResult(this.searchResults[this.selectedSearchIndex]);
        } else {
          this.searchGovernanceDetails();
        }
        break;
      case 'Escape':
        this.showSearchDropdown = false;
        this.selectedSearchIndex = -1;
        break;
    }
  }

  /**
   * Close dropdown when clicking outside
   */
  closeSearchDropdown(): void {
    setTimeout(() => {
      this.showSearchDropdown = false;
      this.selectedSearchIndex = -1;
    }, 200);
  }

  /**
   * Search for governance details by ID
   */
  searchGovernanceDetails(): void {
    if (!this.searchGovernanceId || this.searchGovernanceId.trim() === '') {
      this.searchError = 'Please enter a Governance ID';
      return;
    }

    this.isSearching = true;
    this.isLoading = true;
    this.searchError = '';
    this.showSearchDropdown = false;

    // Clear all previous data before searching
    this.clearAllData();

    this.governanceService
      .fetchGovernanceDetails(this.searchGovernanceId.trim())
      .subscribe({
        next: (data) => {
          console.log('Search results received:', data);

          this.currentGovernanceId = this.searchGovernanceId.trim();

          // Update governance details (report, risk, cost, environment)
          this.updateGovernanceDetailsFromWebSocket(data);

          // Manually trigger chat history update through WebSocket service
          // This ensures the chat-history component receives the data
          if (data.chat_history) {
            this.chatHistoryWebsocket.emitChatHistoryUpdate(data);
          }

          this.isSearching = false;
          this.isLoading = false;
          this.searchError = '';
        },
        error: (error) => {
          console.error('Error fetching governance details:', error);
          this.searchError = `Failed to fetch details for ${this.searchGovernanceId}. Please check the ID and try again.`;
          this.isSearching = false;
          this.isLoading = false;
        },
      });
  }

  setActiveSection(section: SectionType): void {
    this.activeSection = section;
  }

  toggleCommitteeApproval(committee: Committee, approve: boolean): void {
    committee.status = approve ? 'Approved' : 'Rejected';
  }

  downloadDocument(docId: number): void {
    const doc = this.governanceReport.documents.find((d) => d.id === docId);
    if (doc && doc.url) {
      window.open(doc.url, '_blank');
    } else {
      console.log('Download document:', docId);
    }
  }

  getFileIconLabel(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (!ext) return 'FILE';
    if (ext === 'pdf') return 'PDF';
    if (ext === 'doc' || ext === 'docx') return 'DOC';
    return ext.toUpperCase();
  }

  get totalCost(): string {
    const total = this.costDetails.reduce((sum, item) => {
      const amount = parseFloat(item.amount.replace(/[$,]/g, ''));
      return sum + amount;
    }, 0);
    return `$${total.toLocaleString()}`;
  }

  get riskBadgeClass(): string {
    switch (this.riskLevel) {
      case 'Low':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Medium':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'High':
        return 'bg-rose-100 text-rose-700 border-rose-200';
    }
  }

  get requiredCommittees(): number {
    switch (this.riskLevel) {
      case 'Low':
        return 1;
      case 'Medium':
        return 2;
      case 'High':
        return 3;
    }
  }

  /**
   * Handle agent execution start
   */
  onAgentsStarted(): void {
    console.log('Agents execution started...');
    this.isExecutingAgents = true;
  }

  /**
   * Handle agents completion and refresh ALL governance details
   */
  onAgentsCompleted(): void {
    console.log('Agents completed, refreshing all governance details...');

    if (!this.currentGovernanceId) {
      console.error('No current governance ID to refresh');
      this.isExecutingAgents = false;
      return;
    }

    // Refresh ALL governance details to get updated data
    this.governanceService
      .fetchGovernanceDetails(this.currentGovernanceId)
      .subscribe({
        next: (data) => {
          console.log('Refreshed all governance details:', data);

          // Update all sections using the existing method
          this.updateGovernanceDetailsFromWebSocket(data);

          // Manually trigger chat history update
          if (data.chat_history) {
            this.chatHistoryWebsocket.emitChatHistoryUpdate(data);
          }

          this.isExecutingAgents = false;
        },
        error: (error) => {
          console.error('Error refreshing governance details:', error);
          this.isExecutingAgents = false;
        },
      });
  }

  /**
   * Handle agent execution error
   */
  onAgentsError(): void {
    console.log('Agents execution failed');
    this.isExecutingAgents = false;
  }
}

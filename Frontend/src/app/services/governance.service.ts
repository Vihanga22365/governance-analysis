import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface GovernanceDetailsResponse {
  governance_id: string;
  chat_history: any;
  governance_report: any;
  risk_details: any;
  cost_details: any;
  environment_details: any;
}

export interface SearchResultItem {
  created_at: string;
  governance_id: string;
  relevant_documents: any[];
  updated_at: string;
  use_case_description: string;
  use_case_title: string;
  user_chat_session_id: string;
  user_name: string;
  id: string;
}

export interface SearchResponse {
  message: string;
  searchTerm: string;
  data: SearchResultItem[];
  count: number;
}

@Injectable({
  providedIn: 'root',
})
export class GovernanceService {
  private apiBaseUrl = environment.backendApiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Search for governance records by search term
   */
  searchGovernance(searchTerm: string): Observable<SearchResponse> {
    const searchUrl = `${
      this.apiBaseUrl
    }/governance/search/${encodeURIComponent(searchTerm)}`;
    return this.http.get<SearchResponse>(searchUrl);
  }

  /**
   * Fetch all governance details for a given governance ID
   */
  fetchGovernanceDetails(
    governanceId: string
  ): Observable<GovernanceDetailsResponse> {
    const chatHistoryUrl = `${this.apiBaseUrl}/chat-history/${governanceId}`;
    const governanceReportUrl = `${this.apiBaseUrl}/generate-report/governance/${governanceId}`;
    const riskDetailsUrl = `${this.apiBaseUrl}/risk-analyse/governance/${governanceId}`;
    const costDetailsUrl = `${this.apiBaseUrl}/cost-details/governance/${governanceId}`;
    const environmentDetailsUrl = `${this.apiBaseUrl}/environment-details/governance/${governanceId}`;
    const committeeClarificationsUrl = `${this.apiBaseUrl}/committee-clarifications/governance/${governanceId}`;

    return forkJoin({
      chat_history: this.http.get(chatHistoryUrl),
      governance_report: this.http.get(governanceReportUrl),
      risk_details: this.http.get(riskDetailsUrl),
      cost_details: this.http.get(costDetailsUrl),
      environment_details: this.http.get(environmentDetailsUrl),
      committee_clarifications: this.http.get(committeeClarificationsUrl),
    }).pipe(
      map((results) => ({
        governance_id: governanceId,
        chat_history: results.chat_history,
        governance_report: results.governance_report,
        risk_details: results.risk_details,
        cost_details: results.cost_details,
        environment_details: results.environment_details,
        committee_clarifications: results.committee_clarifications,
      }))
    );
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';

export interface GovernanceDetailsResponse {
  governance_id: string;
  chat_history: any;
  governance_report: any;
  risk_details: any;
  cost_details: any;
  environment_details: any;
}

@Injectable({
  providedIn: 'root',
})
export class GovernanceService {
  private apiBaseUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

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

    return forkJoin({
      chat_history: this.http.get(chatHistoryUrl),
      governance_report: this.http.get(governanceReportUrl),
      risk_details: this.http.get(riskDetailsUrl),
      cost_details: this.http.get(costDetailsUrl),
      environment_details: this.http.get(environmentDetailsUrl),
    }).pipe(
      map((results) => ({
        governance_id: governanceId,
        chat_history: results.chat_history,
        governance_report: results.governance_report,
        risk_details: results.risk_details,
        cost_details: results.cost_details,
        environment_details: results.environment_details,
      }))
    );
  }
}

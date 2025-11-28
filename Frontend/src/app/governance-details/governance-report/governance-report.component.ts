import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

interface ReportDocument {
  id: number;
  name: string;
  sizeLabel: string;
}

interface GovernanceReport {
  title: string;
  summary: string;
  recommendations: string[];
  documents: ReportDocument[];
}

@Component({
  selector: 'app-governance-report',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './governance-report.component.html',
  styleUrls: ['./governance-report.component.scss'],
})
export class GovernanceReportComponent {
  @Input() governanceReport: GovernanceReport = {
    title: '',
    summary: '',
    recommendations: [],
    documents: [],
  };

  getFileIconLabel(filename: string): string {
    const extension = filename.split('.').pop()?.toUpperCase() || '';
    return extension.substring(0, 3);
  }

  downloadDocument(docId: number): void {
    console.log('Downloading document:', docId);
    // Emit event or call service to download document
  }
}

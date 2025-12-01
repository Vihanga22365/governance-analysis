import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

interface ReportDocument {
  id: number;
  name: string;
  sizeLabel: string;
  url?: string;
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

  @Input() debugData: any = null; // For debugging WebSocket data

  getFileIconLabel(filename: string): string {
    const extension = filename.split('.').pop()?.toUpperCase() || '';
    return extension.substring(0, 3);
  }

  downloadDocument(docId: number): void {
    const doc = this.governanceReport.documents.find((d) => d.id === docId);
    if (doc && doc.url) {
      window.open(doc.url, '_blank');
    } else {
      console.log('Downloading document:', docId);
    }
  }
}

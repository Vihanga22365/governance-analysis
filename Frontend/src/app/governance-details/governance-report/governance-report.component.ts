import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';

marked.setOptions({
  gfm: true,
  breaks: true,
});

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
  summaryHtml?: SafeHtml;
}

@Component({
  selector: 'app-governance-report',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './governance-report.component.html',
  styleUrls: ['./governance-report.component.scss'],
})
export class GovernanceReportComponent {
  @Input() isDarkTheme: boolean = false;

  @Input() set governanceReport(value: GovernanceReport) {
    this._governanceReport = value;
    if (value.summary) {
      this._governanceReport.summaryHtml = this.convertMarkdownToHtml(
        value.summary
      );
    }
  }
  get governanceReport(): GovernanceReport {
    return this._governanceReport;
  }
  private _governanceReport: GovernanceReport = {
    title: '',
    summary: '',
    recommendations: [],
    documents: [],
  };

  @Input() debugData: any = null; // For debugging WebSocket data

  constructor(private sanitizer: DomSanitizer) {}

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

  private convertMarkdownToHtml(markdown: string): SafeHtml | undefined {
    if (!markdown || !markdown.trim()) {
      return undefined;
    }

    const rawHtml = marked.parse(markdown) as string;
    return this.sanitizer.bypassSecurityTrustHtml(rawHtml);
  }
}

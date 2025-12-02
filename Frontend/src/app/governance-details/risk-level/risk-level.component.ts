import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';

marked.setOptions({
  gfm: true,
  breaks: true,
});

@Component({
  selector: 'app-risk-level',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './risk-level.component.html',
  styleUrls: ['./risk-level.component.scss'],
})
export class RiskLevelComponent {
  @Input() riskLevel: 'Low' | 'Medium' | 'High' = 'Low';

  @Input() set riskReason(value: string) {
    this._riskReason = value;
    if (value) {
      this.riskReasonHtml = this.convertMarkdownToHtml(value);
    } else {
      this.riskReasonHtml = undefined;
    }
  }
  get riskReason(): string {
    return this._riskReason;
  }
  private _riskReason: string = '';
  riskReasonHtml: SafeHtml | undefined = undefined;

  constructor(private sanitizer: DomSanitizer) {}

  get riskBadgeClass(): string {
    switch (this.riskLevel) {
      case 'Low':
        return 'bg-emerald-100 text-emerald-700 border border-emerald-300';
      case 'Medium':
        return 'bg-amber-100 text-amber-700 border border-amber-300';
      case 'High':
        return 'bg-rose-100 text-rose-700 border border-rose-300';
      default:
        return 'bg-slate-100 text-slate-700 border border-slate-300';
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

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Committee {
  name: string;
  role: string;
  status: 'pending' | 'approved' | 'rejected';
}

@Component({
  selector: 'app-committee-approval',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './committee-approval.component.html',
  styleUrls: ['./committee-approval.component.scss'],
})
export class CommitteeApprovalComponent {
  @Input() committees: Committee[] = [];
  @Input() requiredCommittees: number = 0;
  @Input() riskLevel: string = '';
  @Output() approvalToggled = new EventEmitter<{
    committee: Committee;
    approved: boolean;
  }>();

  toggleCommitteeApproval(committee: Committee, approved: boolean): void {
    this.approvalToggled.emit({ committee, approved });
  }
}

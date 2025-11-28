import { Component } from '@angular/core';
import { NgClass, NgIf } from '@angular/common';

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

interface Committee {
  name: string;
  role: string;
  status: 'approved' | 'rejected' | 'pending';
}

interface GovernanceReport {
  title: string;
  summary: string;
  recommendations: string[];
  documents: Array<{
    id: number;
    name: string;
    sizeLabel: string;
  }>;
}

type RiskLevel = 'Low' | 'Medium' | 'High';

interface CostDetail {
  category: string;
  amount: string;
  description: string;
}

interface EnvironmentDetail {
  provider: 'AWS' | 'GCP' | 'Azure';
  region: string;
  services: string[];
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
  imports: [NgClass, NgIf],
  templateUrl: './governance-details.component.html',
  styleUrl: './governance-details.component.scss',
})
export class GovernanceDetailsComponent {
  activeSection: SectionType = 'history';

  // Chat History
  chatHistory: ChatMessage[] = [
    {
      author: 'You',
      timestamp: '09:15 AM',
      text: 'I need a risk assessment for the new deployment pipeline.',
      type: 'outgoing',
    },
    {
      author: 'Risk CoPilot',
      timestamp: '09:16 AM',
      text: "I'll analyze the deployment pipeline documentation. Please upload any relevant architecture diagrams or configuration files.",
      type: 'incoming',
    },
    {
      author: 'You',
      timestamp: '09:18 AM',
      text: '',
      type: 'outgoing',
      attachments: [
        { id: 1, name: 'deployment-architecture.pdf', sizeLabel: '2.4 MB' },
        { id: 2, name: 'security-config.docx', sizeLabel: '156 KB' },
      ],
    },
  ];

  // Governance Report
  governanceReport: GovernanceReport = {
    title: 'Deployment Pipeline Risk Assessment',
    summary:
      'Comprehensive analysis of the proposed deployment pipeline reveals several critical security and compliance considerations. The architecture demonstrates strong automation practices but requires additional controls for production deployments.',
    recommendations: [
      'Implement multi-stage approval workflow for production releases',
      'Add automated security scanning at each pipeline stage',
      'Enforce infrastructure-as-code validation before deployment',
      'Configure audit logging for all deployment activities',
      'Establish rollback procedures with automated health checks',
    ],
    documents: [
      { id: 1, name: 'deployment-architecture.pdf', sizeLabel: '2.4 MB' },
      { id: 2, name: 'security-config.docx', sizeLabel: '156 KB' },
    ],
  };

  // Risk Level
  riskLevel: RiskLevel = 'Medium';
  riskReason: string = 'The deployment pipeline contains several security controls, but lacks multi-stage approval workflows and automated security scanning at critical checkpoints. Additional governance oversight is recommended before production deployment.';

  // Committee Approvals
  committees: Committee[] = [
    { name: 'Security Committee', role: 'CISO Approval', status: 'pending' },
    { name: 'Operations Board', role: 'CTO Approval', status: 'pending' },
  ];

  // Cost Details
  costDetails: CostDetail[] = [
    {
      category: 'Infrastructure',
      amount: '$450,000',
      description: 'Cloud resources and compute capacity',
    },
    {
      category: 'Security Tools',
      amount: '$125,000',
      description: 'Automated scanning and monitoring licenses',
    },
    {
      category: 'Compliance Audit',
      amount: '$75,000',
      description: 'Third-party security assessment',
    },
    {
      category: 'Training',
      amount: '$30,000',
      description: 'Team upskilling and certification',
    },
  ];

  // Environment Details
  environmentDetails: EnvironmentDetail[] = [
    {
      provider: 'AWS',
      region: 'us-east-1',
      services: ['ECS', 'RDS', 'S3', 'CloudWatch'],
      status: 'Active',
    },
    {
      provider: 'AWS',
      region: 'eu-west-1',
      services: ['ECS', 'RDS', 'S3'],
      status: 'Standby',
    },
  ];

  setActiveSection(section: SectionType): void {
    this.activeSection = section;
  }

  toggleCommitteeApproval(committee: Committee, approve: boolean): void {
    committee.status = approve ? 'approved' : 'rejected';
  }

  downloadDocument(docId: number): void {
    console.log('Download document:', docId);
    // In real implementation, would trigger actual download
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
}

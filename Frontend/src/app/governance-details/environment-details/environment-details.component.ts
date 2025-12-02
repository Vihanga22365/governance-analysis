import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

interface ServiceDetail {
  service: string;
  reason: string;
}

interface EnvironmentDetail {
  provider: string;
  region: string;
  status: string;
  services: ServiceDetail[];
}

@Component({
  selector: 'app-environment-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './environment-details.component.html',
  styleUrls: ['./environment-details.component.scss'],
})
export class EnvironmentDetailsComponent {
  @Input() environmentDetails: EnvironmentDetail[] = [];
  @Input() isExecutingAgents: boolean = false;
}

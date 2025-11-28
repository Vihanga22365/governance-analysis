import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

interface EnvironmentDetail {
  provider: string;
  region: string;
  status: string;
  services: string[];
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
}

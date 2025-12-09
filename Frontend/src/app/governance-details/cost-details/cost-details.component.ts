import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

interface CostDetail {
  category: string;
  description: string;
  amount: string;
}

@Component({
  selector: 'app-cost-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cost-details.component.html',
  styleUrls: ['./cost-details.component.scss'],
})
export class CostDetailsComponent {
  @Input() isDarkTheme: boolean = false;
  @Input() costDetails: CostDetail[] = [];
  @Input() totalCost: string = '';
  @Input() isExecutingAgents: boolean = false;
}

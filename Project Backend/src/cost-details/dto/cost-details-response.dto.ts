export class CostBreakdownItem {
  category: string;
  description: string;
  amount: number;
  notes?: string;
}

export class CostDetailsResponseDto {
  cost_details_id?: string;
  user_name: string;
  governance_id: string;
  total_estimated_cost: number;
  cost_breakdown: CostBreakdownItem[];
  created_at?: string;
}

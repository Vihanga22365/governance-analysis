import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsArray,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CostBreakdownItemDto {
  @IsString()
  @IsNotEmpty()
  category: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateCostDetailsDto {
  @IsString()
  @IsNotEmpty()
  user_name: string;

  @IsString()
  @IsNotEmpty()
  governance_id: string;

  @IsNumber()
  @IsNotEmpty()
  total_estimated_cost: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CostBreakdownItemDto)
  cost_breakdown: CostBreakdownItemDto[];
}

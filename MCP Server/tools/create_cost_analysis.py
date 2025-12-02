from pydantic import BaseModel, Field, field_validator
from typing import List, Optional


class CostBreakdownItem(BaseModel):
    """Individual cost breakdown item."""
    category: str = Field(..., description="Cost category (e.g., 'Infrastructure', 'Development')")
    description: str = Field(..., description="Description of the cost item")
    amount: float = Field(..., gt=0, description="Cost amount (must be greater than 0)")
    notes: Optional[str] = Field(None, description="Additional notes or details")


class CostAnalysisPayload(BaseModel):
    """Payload for creating cost analysis."""
    user_name: str = Field(..., description="Name of the user creating the cost analysis")
    governance_id: str = Field(..., description="Governance ID")
    total_estimated_cost: float = Field(..., gt=0, description="Total estimated cost")
    cost_breakdown: List[CostBreakdownItem] = Field(..., min_length=1, description="List of cost breakdown items")
    
    @field_validator('cost_breakdown')
    @classmethod
    def validate_cost_breakdown(cls, v, info):
        """Validate that cost breakdown items sum up reasonably to total cost."""
        if v:
            breakdown_sum = sum(item.amount for item in v)
            # Allow some flexibility for rounding differences
            if abs(breakdown_sum - info.data.get('total_estimated_cost', 0)) > 0.01:
                raise ValueError(
                    f"Cost breakdown sum ({breakdown_sum}) does not match total_estimated_cost "
                    f"({info.data.get('total_estimated_cost', 0)})"
                )
        return v


def create_cost_analysis(
    governance_id: str,
    user_name: str,
    total_estimated_cost: float,
    cost_breakdown: List[dict]
) -> dict:
    """
    Create a cost analysis for a specific governance ID.
    
    Creates a detailed cost breakdown with validation.
    
    Args:
        governance_id (str): Governance ID (e.g., "GOV0001").
        user_name (str): Name of the user creating the cost analysis (e.g., "John Doe").
        total_estimated_cost (float): Total estimated cost (must be greater than 0).
        cost_breakdown (List[dict]): List of cost breakdown items. Each item must contain:
            - category (str): Cost category
            - description (str): Description of the cost item
            - amount (float): Cost amount (must be greater than 0)
            - notes (str, optional): Additional notes
    
    Returns:
        dict: Dictionary containing success message and created cost analysis data, or error information.
    """
    import urllib.request
    import json
    from config import API_BASE_URL
    
    try:
        # Step 1: Validate the payload using Pydantic
        try:
            validated_payload = CostAnalysisPayload(
                user_name=user_name,
                governance_id=governance_id,
                total_estimated_cost=total_estimated_cost,
                cost_breakdown=[CostBreakdownItem(**item) for item in cost_breakdown]
            )
        except Exception as validation_error:
            return {
                "error": f"Validation error: {str(validation_error)}",
                "validation_failed": True
            }
        
        # Step 2: Create the cost analysis
        cost_url = f"{API_BASE_URL}/cost-details"
        
        # Convert Pydantic model to dict for JSON serialization
        payload = validated_payload.model_dump()
        data = json.dumps(payload).encode('utf-8')
        
        cost_req = urllib.request.Request(
            cost_url,
            data=data,
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        
        with urllib.request.urlopen(cost_req, timeout=10) as cost_resp:
            return json.load(cost_resp)
    
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        try:
            error_data = json.loads(error_body)
            return {
                "error": f"HTTP {e.code}: {error_data.get('message', 'Unknown error')}",
                "status_code": e.code
            }
        except json.JSONDecodeError:
            return {
                "error": f"HTTP {e.code}: {error_body}",
                "status_code": e.code
            }
    
    except urllib.error.URLError as e:
        from config import LOCAL_IP
        return {
            "error": f"Connection error: {str(e.reason)}. Make sure the API server is running on http://{LOCAL_IP}:3000"
        }
    
    except Exception as e:
        return {
            "error": f"Error creating cost analysis: {str(e)}"
        }

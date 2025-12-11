from pydantic import BaseModel, Field, field_validator
from typing import List, Optional


class CostBreakdownItem(BaseModel):
    """Individual cost breakdown item."""
    category: str = Field(..., description="Cost category (e.g., 'Infrastructure', 'Development')")
    description: str = Field(..., description="Description of the cost item")
    amount: float = Field(..., gt=0, description="Cost amount (must be greater than 0)")
    notes: Optional[str] = Field(None, description="Additional notes or details")


class CostClarificationItem(BaseModel):
    """Individual cost clarification item for updating."""
    unique_code: str = Field(..., description="The clarification code")
    user_answer: str = Field(..., description="The user's answer to the clarification")
    status: str = Field(..., description="Status of the clarification")
    
    @field_validator('unique_code')
    @classmethod
    def validate_unique_code(cls, v: str) -> str:
        valid_codes = ['resource_count', 'cost_per_resource', 'project_duration', 'licensed_software']
        if v not in valid_codes:
            raise ValueError(f'unique_code must be one of {valid_codes}')
        return v
    
    @field_validator('user_answer')
    @classmethod
    def validate_user_answer(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError('user_answer cannot be empty')
        return v.strip()
    
    @field_validator('status')
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in ['pending', 'completed']:
            raise ValueError('status must be either "pending" or "completed"')
        return v


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
    cost_breakdown: List[dict],
    clarifications: Optional[List[dict]] = None
) -> dict:
    """
    Create a cost analysis for a specific governance ID and optionally update cost clarifications.
    
    Creates a detailed cost breakdown with validation and updates clarifications if provided.
    
    Args:
        governance_id (str): Governance ID (e.g., "GOV0001").
        user_name (str): Name of the user creating the cost analysis (e.g., "John Doe").
        total_estimated_cost (float): Total estimated cost (must be greater than 0).
        cost_breakdown (List[dict]): List of cost breakdown items. Each item must contain:
            - category (str): Cost category
            - description (str): Description of the cost item
            - amount (float): Cost amount (must be greater than 0)
            - notes (str, optional): Additional notes
        clarifications (List[dict], optional): List of clarification objects to update. Each item must contain:
            - unique_code (str): The clarification code (e.g., "resource_count")
            - user_answer (str): The user's answer to the clarification
            - status (str): Status of the clarification - "pending" or "completed"
    
    Returns:
        dict: Dictionary containing success message and created cost analysis data, or error information.
    """
    import urllib.request
    import json
    from config import API_BASE_URL, COST_CLARIFICATIONS_API_URL
    from utilities.api_helpers import broadcast_governance_data
    
    try:
        # Step 1: Validate the cost analysis payload using Pydantic
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
        
        # Step 2: Validate clarifications if provided
        validated_clarifications = None
        if clarifications:
            try:
                validated_clarifications = [CostClarificationItem(**item) for item in clarifications]
            except Exception as validation_error:
                return {
                    "error": f"Clarification validation error: {str(validation_error)}",
                    "validation_failed": True
                }
        
        # Step 3: Create the cost analysis
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
        
        cost_response = None
        with urllib.request.urlopen(cost_req, timeout=10) as cost_resp:
            cost_response = json.load(cost_resp)
        
        # Step 4: Update cost clarifications if provided
        clarification_response = None
        if validated_clarifications:
            try:
                clarification_url = f"{COST_CLARIFICATIONS_API_URL}/{governance_id}"
                
                # Prepare clarifications payload
                clarification_payload = {
                    "clarifications": [
                        {
                            "unique_code": item.unique_code,
                            "user_answer": item.user_answer,
                            "status": item.status
                        }
                        for item in validated_clarifications
                    ]
                }
                
                clarification_data = json.dumps(clarification_payload).encode('utf-8')
                
                clarification_req = urllib.request.Request(
                    clarification_url,
                    data=clarification_data,
                    headers={'Content-Type': 'application/json'},
                    method='PUT'
                )
                
                with urllib.request.urlopen(clarification_req, timeout=10) as clarification_resp:
                    clarification_response = json.load(clarification_resp)
                    print(f"Updated cost clarifications for {governance_id}")
            
            except urllib.error.HTTPError as clarification_error:
                # Log clarification update error but don't fail the entire operation
                print(f"Warning: Failed to update cost clarifications: {clarification_error}")
            except Exception as clarification_error:
                # Log clarification update error but don't fail the entire operation
                print(f"Warning: Error updating cost clarifications: {str(clarification_error)}")
        
        # Step 5: Broadcast updated governance data to WebSocket clients
        try:
            broadcast_governance_data(governance_id, section='cost_details', sub_section='none')
            print(f"Broadcasted cost details for {governance_id}")
        except Exception as broadcast_error:
            print(f"Failed to broadcast cost details: {broadcast_error}")
        
        # Return combined response
        response = {
            "cost_analysis": cost_response
        }
        if clarification_response:
            response["clarifications"] = clarification_response
        
        return response
    
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
            "error": f"Connection error: {str(e.reason)}. Make sure the API server is running on http://{LOCAL_IP}:8353"
        }
    
    except Exception as e:
        return {
            "error": f"Error creating cost analysis: {str(e)}"
        }

def update_cost_clarification(
    governance_id: str,
    section_code: str,
    user_answer: str,
    status: str = "completed"
) -> dict:
    """
    Update a specific cost clarification for a governance record.
    
    Updates the user's answer and status for a cost-related clarification question.
    Supported section codes: resource_count, cost_per_resource, project_duration, licensed_software
    
    Args:
        governance_id: The governance ID (e.g., "GOV0001")
        section_code: The clarification code (e.g., "resource_count")
        user_answer: The user's answer to the clarification (e.g., "3 DE, 1 QA, 1 PM")
        status: Status of the clarification - "pending" or "completed" (default: "completed")
    
    Returns:
        Dictionary containing:
            - message: Success/error message
            - data: Updated clarifications data with all clarification entries
    """
    import urllib.request
    import json
    from config import COST_CLARIFICATIONS_API_URL
    from pydantic import BaseModel, field_validator
    
    # Pydantic validation model
    class UpdateCostClarificationRequest(BaseModel):
        section_code: str
        user_answer: str
        status: str
        
        @field_validator('section_code')
        @classmethod
        def validate_section_code(cls, v: str) -> str:
            valid_codes = ['resource_count', 'cost_per_resource', 'project_duration', 'licensed_software']
            if v not in valid_codes:
                raise ValueError(f'section_code must be one of {valid_codes}')
            return v
        
        @field_validator('status')
        @classmethod
        def validate_status(cls, v: str) -> str:
            if v not in ['pending', 'completed']:
                raise ValueError('status must be either "pending" or "completed"')
            return v
    
    try:
        # Validate input
        request = UpdateCostClarificationRequest(
            section_code=section_code,
            user_answer=user_answer,
            status=status
        )
        url = f"{COST_CLARIFICATIONS_API_URL}/{governance_id}/{section_code}"
        
        # Prepare request payload
        payload = {
            "user_answer": request.user_answer,
            "status": request.status
        }
        
        # Convert payload to JSON bytes
        data = json.dumps(payload).encode('utf-8')
        
        # Create request with headers
        req = urllib.request.Request(
            url,
            data=data,
            headers={'Content-Type': 'application/json'},
            method='PUT'
        )
        
        # Make the API call
        with urllib.request.urlopen(req, timeout=10) as resp:
            response_data = json.load(resp)
            return response_data
    
    except ValueError as ve:
        return {
            "error": f"Validation error: {str(ve)}"
        }
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
    except Exception as e:
        return {
            "error": f"Error updating cost clarification: {str(e)}"
        }

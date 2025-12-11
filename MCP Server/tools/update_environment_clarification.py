def update_environment_clarification(
    governance_id: str,
    clarifications: list
) -> dict:
    """
    Update multiple environment clarifications for a governance record.
    
    Updates user answers and status for multiple environment-related clarification questions in a single operation.
    Supported section codes: prefer_environment, pii_data, technologies, expected_user_count, architecture_type
    
    Args:
        governance_id: The governance ID (e.g., "GOV0001")
        clarifications: List of clarification objects, each containing:
            - unique_code: The clarification code (e.g., "prefer_environment")
            - user_answer: The user's answer to the clarification (e.g., "AWS")
            - status: Status of the clarification - "pending" or "completed"
    
    Returns:
        Dictionary containing:
            - message: Success/error message
            - data: Updated clarifications data with all clarification entries
    """
    import urllib.request
    import json
    from config import ENVIRONMENT_CLARIFICATIONS_API_URL
    from pydantic import BaseModel, field_validator
    from typing import List
    from utilities.api_helpers import broadcast_governance_data
    
    # Pydantic validation models
    class EnvironmentClarificationItem(BaseModel):
        unique_code: str
        user_answer: str
        status: str
        
        @field_validator('unique_code')
        @classmethod
        def validate_unique_code(cls, v: str) -> str:
            valid_codes = ['prefer_environment', 'pii_data', 'technologies', 'expected_user_count', 'architecture_type']
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
    
    class UpdateEnvironmentClarificationsRequest(BaseModel):
        clarifications: List[EnvironmentClarificationItem]
    
    try:
        # Validate input
        validated = UpdateEnvironmentClarificationsRequest(
            clarifications=clarifications
        )
        
        url = f"{ENVIRONMENT_CLARIFICATIONS_API_URL}/{governance_id}"
        
        # Prepare request payload with array of clarifications
        payload = {
            "clarifications": [
                {
                    "unique_code": item.unique_code,
                    "user_answer": item.user_answer,
                    "status": item.status
                }
                for item in validated.clarifications
            ]
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
            
            # Broadcast updated governance data to WebSocket clients
            try:
                broadcast_governance_data(governance_id, section='environment_details', sub_section='none')
                print(f"Broadcasted updated environment clarifications for {governance_id}")
            except Exception as broadcast_error:
                print(f"Failed to broadcast environment clarifications: {broadcast_error}")
            
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
            "error": f"Error updating environment clarifications: {str(e)}"
        }

def create_committee_clarification(
    governance_id: str,
    user_name: str,
    risk_level: str
) -> dict:
    """
    Create committee clarifications for a governance record based on risk level.
    
    Auto-populates clarifications based on risk level:
    - low: Committee 1 (1 question answered, 2 pending)
    - medium: Committee 1 (all answered) + Committee 2 (1 answered, 2 pending)
    - high: Committee 1 (all answered) + Committee 2 (all answered) + Committee 3 (1 answered, 2 pending)
    
    Args:
        governance_id: The governance ID (e.g., "GOV0001")
        user_name: Name of the user creating the clarifications (e.g., "John Doe")
        risk_level: Risk level - "low", "medium", or "high"
    
    Returns:
        Dictionary containing:
            - message: Success message
            - data: Created committee clarifications with all committees and their questions
    """
    import urllib.request
    import json
    from config import API_BASE_URL
    from pydantic import BaseModel, field_validator
    from utilities.api_helpers import broadcast_governance_data
    
    # Pydantic validation model
    class CreateCommitteeClarificationRequest(BaseModel):
        governance_id: str
        user_name: str
        risk_level: str
        
        @field_validator('risk_level')
        @classmethod
        def validate_risk_level(cls, v: str) -> str:
            if v not in ['low', 'medium', 'high']:
                raise ValueError('risk_level must be one of: "low", "medium", or "high"')
            return v
        
        @field_validator('governance_id')
        @classmethod
        def validate_governance_id(cls, v: str) -> str:
            if not v or not v.strip():
                raise ValueError('governance_id cannot be empty')
            return v.strip()
        
        @field_validator('user_name')
        @classmethod
        def validate_user_name(cls, v: str) -> str:
            if not v or not v.strip():
                raise ValueError('user_name cannot be empty')
            return v.strip()
    
    try:
        # Validate input
        validated = CreateCommitteeClarificationRequest(
            governance_id=governance_id,
            user_name=user_name,
            risk_level=risk_level
        )
        
        url = f"{API_BASE_URL}/committee-clarifications"
        
        payload = {
            "governance_id": validated.governance_id,
            "user_name": validated.user_name,
            "risk_level": validated.risk_level,
            "clarifications": []
        }
        
        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(
            url,
            data=data,
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        
        with urllib.request.urlopen(req, timeout=10) as resp:
            response = json.load(resp)
            
            # Broadcast the updated governance data
            broadcast_governance_data(governance_id)
            
            return response
            
    except ValueError as e:
        return {
            "error": f"Validation error: {str(e)}"
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
            "error": f"Error creating committee clarifications: {str(e)}"
        }

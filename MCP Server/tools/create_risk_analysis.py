from pydantic import BaseModel, Field, field_validator


class RiskAnalysisPayload(BaseModel):
    """Payload for creating risk analysis."""
    user_name: str = Field(..., description="Name of the user creating the risk analysis")
    governance_id: str = Field(..., description="Governance ID")
    risk_level: str = Field(..., description="Risk level assessment")
    reason: str = Field(..., min_length=1, description="Reason or justification for the risk assessment")
    
    @field_validator('risk_level')
    @classmethod
    def validate_risk_level(cls, v):
        """Validate risk level is one of the accepted values."""
        v_lower = v.lower()
        valid_levels = ['low', 'medium', 'high']
        if v_lower not in valid_levels:
            raise ValueError(
                f"Risk level must be one of: {', '.join(valid_levels)}. Got: {v}"
            )
        return v_lower
    
    @field_validator('reason')
    @classmethod
    def validate_reason(cls, v):
        """Ensure reason is not empty or just whitespace."""
        if not v or not v.strip():
            raise ValueError("Reason must be a non-empty string")
        return v.strip()


def create_risk_analysis(
    session_id: str,
    user_name: str,
    risk_level: str,
    reason: str
) -> dict:
    """
    Create a risk analysis for a specific session.
    
    Retrieves the governance ID from the session and creates a risk assessment
    with the provided risk level and justification.
    
    Args:
        session_id (str): User chat session ID to retrieve governance ID (e.g., "54654-56454-bjhvh").
        user_name (str): Name of the user creating the risk analysis (e.g., "John Doe").
        risk_level (str): Risk level assessment - must be one of: "low", "medium", "high".
        reason (str): Reason or justification for the risk assessment (must be non-empty).
    
    Returns:
        dict: Dictionary containing success message and created risk analysis data, or error information.
    """
    import urllib.request
    import json
    from config import GOVERNANCE_API_URL, API_BASE_URL
    
    try:
        # Step 1: Get governance_id from session_id
        session_url = f"{GOVERNANCE_API_URL}/session/{session_id}"
        session_req = urllib.request.Request(session_url, method='GET')
        
        with urllib.request.urlopen(session_req, timeout=10) as session_resp:
            session_data = json.load(session_resp)
            
            if not session_data.get('data') or len(session_data['data']) == 0:
                return {
                    "error": "No governance found for the provided session ID",
                    "session_id": session_id
                }
            
            governance_id = session_data['data'][0].get('governance_id')
            
            if not governance_id:
                return {
                    "error": "Governance ID not found in session data",
                    "session_id": session_id
                }
        
        # Step 2: Validate the payload using Pydantic
        try:
            validated_payload = RiskAnalysisPayload(
                user_name=user_name,
                governance_id=governance_id,
                risk_level=risk_level,
                reason=reason
            )
        except Exception as validation_error:
            return {
                "error": f"Validation error: {str(validation_error)}",
                "validation_failed": True
            }
        
        # Step 3: Create the risk analysis
        risk_url = f"{API_BASE_URL}/risk-analyse"
        
        # Convert Pydantic model to dict for JSON serialization
        payload = validated_payload.model_dump()
        data = json.dumps(payload).encode('utf-8')
        
        risk_req = urllib.request.Request(
            risk_url,
            data=data,
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        
        with urllib.request.urlopen(risk_req, timeout=10) as risk_resp:
            return json.load(risk_resp)
    
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
            "error": f"Error creating risk analysis: {str(e)}"
        }

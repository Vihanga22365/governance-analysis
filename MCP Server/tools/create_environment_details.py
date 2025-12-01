from pydantic import BaseModel, Field, field_validator
from typing import List


class EnvironmentDetailsPayload(BaseModel):
    """Payload for creating environment details."""
    user_name: str = Field(..., description="Name of the user creating the environment details")
    governance_id: str = Field(..., description="Governance ID")
    environment: str = Field(..., description="Cloud/hosting environment (e.g., 'aws', 'azure', 'gcp')")
    environment_breakdown: List[str] = Field(..., min_length=1, description="List of services/components")
    
    @field_validator('environment')
    @classmethod
    def validate_environment(cls, v):
        """Validate environment is a known cloud provider or valid environment type."""
        v_lower = v.lower()
        valid_environments = ['aws', 'azure', 'gcp', 'on-premise', 'hybrid', 'digitalocean', 'heroku']
        if v_lower not in valid_environments:
            # Still allow it but could add warning in production
            pass
        return v
    
    @field_validator('environment_breakdown')
    @classmethod
    def validate_breakdown_not_empty(cls, v):
        """Ensure environment breakdown list is not empty and contains valid strings."""
        if not v:
            raise ValueError("Environment breakdown must contain at least one service")
        
        for item in v:
            if not item or not isinstance(item, str) or not item.strip():
                raise ValueError("Environment breakdown items must be non-empty strings")
        
        return v


def create_environment_details(
    session_id: str,
    user_name: str,
    environment: str,
    environment_breakdown: List[str]
) -> dict:
    """
    Create environment setup details for a specific session.
    
    Retrieves the governance ID from the session and creates environment configuration
    details with validation.
    
    Args:
        session_id (str): User chat session ID to retrieve governance ID (e.g., "54654-56454-bjhvh").
        user_name (str): Name of the user creating the environment details (e.g., "John Doe").
        environment (str): Cloud/hosting environment (e.g., "aws", "azure", "gcp").
        environment_breakdown (List[str]): List of services/components (e.g., ["ec2", "s3"]).
                                          Must contain at least one item.
    
    Returns:
        dict: Dictionary containing success message and created environment details data, or error information.
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
            validated_payload = EnvironmentDetailsPayload(
                user_name=user_name,
                governance_id=governance_id,
                environment=environment,
                environment_breakdown=environment_breakdown
            )
        except Exception as validation_error:
            return {
                "error": f"Validation error: {str(validation_error)}",
                "validation_failed": True
            }
        
        # Step 3: Create the environment details
        env_url = f"{API_BASE_URL}/environment-details"
        
        # Convert Pydantic model to dict for JSON serialization
        payload = validated_payload.model_dump()
        data = json.dumps(payload).encode('utf-8')
        
        env_req = urllib.request.Request(
            env_url,
            data=data,
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        
        with urllib.request.urlopen(env_req, timeout=10) as env_resp:
            return json.load(env_resp)
    
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
            "error": f"Error creating environment details: {str(e)}"
        }

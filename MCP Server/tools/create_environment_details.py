from pydantic import BaseModel, Field, field_validator
from typing import List


class EnvironmentService(BaseModel):
    """Individual service in the environment breakdown."""
    service: str = Field(..., description="Name of the service (e.g., 'ec2', 's3')")
    reason: str = Field(..., description="Reason for using this service")


class EnvironmentDetailsPayload(BaseModel):
    """Payload for creating environment details."""
    user_name: str = Field(..., description="Name of the user creating the environment details")
    governance_id: str = Field(..., description="Governance ID")
    environment: str = Field(..., description="Cloud/hosting environment (e.g., 'aws', 'azure', 'gcp')")
    region: str = Field(..., description="Region for the environment (e.g., 'us-east-1', 'eu-west-1')")
    environment_breakdown: List[EnvironmentService] = Field(..., min_length=1, description="List of services with reasons")
    
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
        """Ensure environment breakdown list is not empty and contains valid services."""
        if not v:
            raise ValueError("Environment breakdown must contain at least one service")
        
        for item in v:
            if not item.service or not item.service.strip():
                raise ValueError("Service name must be a non-empty string")
            if not item.reason or not item.reason.strip():
                raise ValueError("Service reason must be a non-empty string")
        
        return v


def create_environment_details(
    governance_id: str,
    user_name: str,
    environment: str,
    region: str,
    environment_breakdown: List[dict]
) -> dict:
    """
    Create environment setup details for a specific governance ID.
    
    Creates environment configuration details with validation.
    
    Args:
        governance_id (str): Governance ID (e.g., "GOV0001").
        user_name (str): Name of the user creating the environment details (e.g., "John Doe").
        environment (str): Cloud/hosting environment (e.g., "aws", "azure", "gcp").
        region (str): Region for the environment (e.g., "us-east-1", "eu-west-1").
        environment_breakdown (List[dict]): List of services with reasons.
                                           Each item should be a dict with 'service' and 'reason' keys.
                                           E.g., [{"service": "ec2", "reason": "Compute instances"}].
                                           Must contain at least one item.
    
    Returns:
        dict: Dictionary containing success message and created environment details data, or error information.
    """
    import urllib.request
    import json
    from config import API_BASE_URL
    
    try:
        # Step 1: Validate the payload using Pydantic
        try:
            validated_payload = EnvironmentDetailsPayload(
                user_name=user_name,
                governance_id=governance_id,
                environment=environment,
                region=region,
                environment_breakdown=environment_breakdown
            )
        except Exception as validation_error:
            return {
                "error": f"Validation error: {str(validation_error)}",
                "validation_failed": True
            }
        
        # Step 2: Create the environment details
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
            "error": f"Connection error: {str(e.reason)}. Make sure the API server is running on http://{LOCAL_IP}:8353"
        }
    
    except Exception as e:
        return {
            "error": f"Error creating environment details: {str(e)}"
        }

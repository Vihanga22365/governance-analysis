from pydantic import BaseModel, Field, field_validator
from typing import List, Optional


class EnvironmentService(BaseModel):
    """Individual service in the environment breakdown."""
    service: str = Field(..., description="Name of the service (e.g., 'ec2', 's3')")
    reason: str = Field(..., description="Reason for using this service")


class EnvironmentClarificationItem(BaseModel):
    """Individual environment clarification item for updating."""
    unique_code: str = Field(..., description="The clarification code")
    user_answer: str = Field(..., description="The user's answer to the clarification")
    status: str = Field(..., description="Status of the clarification")
    
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
    environment_breakdown: List[dict],
    clarifications: Optional[List[dict]] = None
) -> dict:
    """
    Create environment setup details for a specific governance ID and optionally update environment clarifications.
    
    Creates environment configuration details with validation and updates clarifications if provided.
    
    Args:
        governance_id (str): Governance ID (e.g., "GOV0001").
        user_name (str): Name of the user creating the environment details (e.g., "John Doe").
        environment (str): Cloud/hosting environment (e.g., "aws", "azure", "gcp").
        region (str): Region for the environment (e.g., "us-east-1", "eu-west-1").
        environment_breakdown (List[dict]): List of services with reasons.
                                           Each item should be a dict with 'service' and 'reason' keys.
                                           E.g., [{"service": "ec2", "reason": "Compute instances"}].
                                           Must contain at least one item.
        clarifications (List[dict], optional): List of clarification objects to update. Each item must contain:
            - unique_code (str): The clarification code (e.g., "prefer_environment")
            - user_answer (str): The user's answer to the clarification
            - status (str): Status of the clarification - "pending" or "completed"
    
    Returns:
        dict: Dictionary containing success message and created environment details data, or error information.
    """
    import urllib.request
    import json
    from config import API_BASE_URL, ENVIRONMENT_CLARIFICATIONS_API_URL
    from utilities.api_helpers import broadcast_governance_data
    
    try:
        # Step 1: Validate the environment details payload using Pydantic
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
        
        # Step 2: Validate clarifications if provided
        validated_clarifications = None
        if clarifications:
            try:
                validated_clarifications = [EnvironmentClarificationItem(**item) for item in clarifications]
            except Exception as validation_error:
                return {
                    "error": f"Clarification validation error: {str(validation_error)}",
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
        
        env_response = None
        with urllib.request.urlopen(env_req, timeout=10) as env_resp:
            env_response = json.load(env_resp)
        
        # Step 4: Update environment clarifications if provided
        clarification_response = None
        if validated_clarifications:
            try:
                clarification_url = f"{ENVIRONMENT_CLARIFICATIONS_API_URL}/{governance_id}"
                
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
                    print(f"Updated environment clarifications for {governance_id}")
            
            except urllib.error.HTTPError as clarification_error:
                # Log clarification update error but don't fail the entire operation
                print(f"Warning: Failed to update environment clarifications: {clarification_error}")
            except Exception as clarification_error:
                # Log clarification update error but don't fail the entire operation
                print(f"Warning: Error updating environment clarifications: {str(clarification_error)}")
        
        # Step 5: Broadcast updated governance data to WebSocket clients
        try:
            broadcast_governance_data(governance_id, section='environment_details', sub_section='none')
            print(f"Broadcasted environment details for {governance_id}")
        except Exception as broadcast_error:
            print(f"Failed to broadcast environment details: {broadcast_error}")
        
        # Return combined response
        response = {
            "environment_details": env_response
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
            "error": f"Error creating environment details: {str(e)}"
        }

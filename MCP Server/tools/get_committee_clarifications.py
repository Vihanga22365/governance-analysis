def get_committee_clarifications(governance_id: str, committee: str = "committee_1") -> dict:
    """
    Retrieve committee clarifications for a specific governance ID and committee.
    
    Fetches all committee-related clarification questions and their current status/answers
    for the specified committee (committee_1, committee_2, or committee_3).
    
    Args:
        governance_id: The governance ID to retrieve clarifications for (e.g., "GOV0001")
        committee: The committee to retrieve clarifications for - "committee_1", "committee_2", or "committee_3" (default: "committee_1")
    
    Returns:
        Dictionary containing:
            - message: Success message
            - governanceId: The governance ID
            - data: Clarifications data with nested structure for each committee
                    Each committee contains array of: clarification, unique_code, user_answer, status
    """
    import urllib.request
    import json
    from config import API_BASE_URL
    from utilities.api_helpers import broadcast_governance_data
    from pydantic import BaseModel, field_validator, ValidationError
    
    # Pydantic validation model
    class CommitteeRequest(BaseModel):
        governance_id: str
        committee: str
        
        @field_validator('governance_id')
        @classmethod
        def governance_id_must_not_be_empty(cls, v: str) -> str:
            if not v or not v.strip():
                raise ValueError('governance_id must not be empty')
            return v
        
        @field_validator('committee')
        @classmethod
        def validate_committee(cls, v: str) -> str:
            valid_committees = ['committee_1', 'committee_2', 'committee_3']
            if v not in valid_committees:
                raise ValueError(f'committee must be one of {valid_committees}')
            return v
    
    try:
        # Validate input
        validated = CommitteeRequest(
            governance_id=governance_id,
            committee=committee
        )
        
        url = f"{API_BASE_URL}/committee-clarifications/governance/{validated.governance_id}"
        req = urllib.request.Request(url, method='GET')
        
        with urllib.request.urlopen(req, timeout=10) as resp:
            response = json.load(resp)
            
            # Broadcast updated governance data to WebSocket clients
            try:
                broadcast_governance_data(validated.governance_id, section='commitee_approval', sub_section=validated.committee)
                print(f"Broadcasted committee clarifications for {validated.governance_id}, committee: {validated.committee}")
            except Exception as broadcast_error:
                print(f"Failed to broadcast committee clarifications: {broadcast_error}")
            
            return response
    
    except ValidationError as e:
        return {
            "error": "Validation error",
            "details": e.errors()
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
            "error": f"Error fetching committee clarifications: {str(e)}"
        }

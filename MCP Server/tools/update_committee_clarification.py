def update_committee_clarification(
    governance_id: str,
    committee: str,
    clarifications: list
) -> dict:
    """
    Update multiple committee clarifications for a governance record.
    
    Updates user answers and status for multiple committee-related clarification questions in a single operation.
    
    Supported committees and section codes:
    - committee_1: core_business_impact, internal_users_only, tech_approved_org
    - committee_2: sensitive_data, system_integration, block_other_teams
    - committee_3: regulatory_compliance, reputation_impact, multi_business_scale
    
    Args:
        governance_id: The governance ID (e.g., "GOV0001")
        committee: The committee type - "committee_1", "committee_2", or "committee_3"
        clarifications: List of clarification objects, each containing:
            - unique_code: The clarification code (e.g., "core_business_impact")
            - user_answer: The user's answer to the clarification
            - status: Status of the clarification - "pending" or "completed"
    
    Returns:
        Dictionary containing:
            - message: Success/error message
            - data: Updated clarifications data with all committee entries
    """
    import urllib.request
    import json
    from config import API_BASE_URL
    from pydantic import BaseModel, field_validator
    from typing import List
    from utilities.api_helpers import broadcast_governance_data
    
    # Define valid codes per committee
    COMMITTEE_1_CODES = ['core_business_impact', 'internal_users_only', 'tech_approved_org']
    COMMITTEE_2_CODES = ['sensitive_data', 'system_integration', 'block_other_teams']
    COMMITTEE_3_CODES = ['regulatory_compliance', 'reputation_impact', 'multi_business_scale']
    
    ALL_SECTION_CODES = COMMITTEE_1_CODES + COMMITTEE_2_CODES + COMMITTEE_3_CODES
    
    # Pydantic validation models
    class CommitteeClarificationItem(BaseModel):
        unique_code: str
        user_answer: str
        status: str
        
        @field_validator('unique_code')
        @classmethod
        def validate_unique_code(cls, v: str) -> str:
            if v not in ALL_SECTION_CODES:
                raise ValueError(
                    f'unique_code must be one of:\n'
                    f'  Committee 1: {COMMITTEE_1_CODES}\n'
                    f'  Committee 2: {COMMITTEE_2_CODES}\n'
                    f'  Committee 3: {COMMITTEE_3_CODES}'
                )
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
    
    class UpdateCommitteeClarificationsRequest(BaseModel):
        committee: str
        clarifications: List[CommitteeClarificationItem]
        
        @field_validator('committee')
        @classmethod
        def validate_committee(cls, v: str) -> str:
            valid_committees = ['committee_1', 'committee_2', 'committee_3']
            if v not in valid_committees:
                raise ValueError(f'committee must be one of {valid_committees}')
            return v
    
    try:
        # Validate input
        validated = UpdateCommitteeClarificationsRequest(
            committee=committee,
            clarifications=clarifications
        )
        
        # Validate that all section codes belong to the specified committee
        committee_codes_map = {
            'committee_1': COMMITTEE_1_CODES,
            'committee_2': COMMITTEE_2_CODES,
            'committee_3': COMMITTEE_3_CODES
        }
        valid_codes_for_committee = committee_codes_map[validated.committee]
        
        for item in validated.clarifications:
            if item.unique_code not in valid_codes_for_committee:
                return {
                    "error": f"unique_code '{item.unique_code}' is not valid for {validated.committee}. Valid codes: {valid_codes_for_committee}"
                }
        
        url = f"{API_BASE_URL}/committee-clarifications/{governance_id}/{validated.committee}"
        
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
        
        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(
            url,
            data=data,
            headers={'Content-Type': 'application/json'},
            method='PUT'
        )
        
        with urllib.request.urlopen(req, timeout=10) as resp:
            response = json.load(resp)
            
            # Broadcast the updated governance data
            broadcast_governance_data(governance_id, section='commitee_approval', sub_section=validated.committee)
            
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
            "error": f"Error updating committee clarifications: {str(e)}"
        }

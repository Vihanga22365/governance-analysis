from pydantic import BaseModel, field_validator, ValidationError
from typing import Literal, Optional, List
import urllib.request
import urllib.error
import json
from config import API_BASE_URL
from utilities.api_helpers import broadcast_governance_data

class CommitteeStatusItem(BaseModel):
    committee: Literal['committee_1', 'committee_2', 'committee_3']
    status: Literal['Approved', 'Rejected', 'Pending']

class CommitteeUpdateModel(BaseModel):
    governance_id: str
    committees: List[CommitteeStatusItem]

    @field_validator('governance_id')
    def governance_id_must_not_be_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('governance_id must not be empty')
        return v

    @field_validator('committees')
    def committees_must_not_be_empty(cls, v):
        if not v or len(v) == 0:
            raise ValueError('At least one committee must be provided')
        return v


def update_committee_status(governance_id: str, committees: list) -> dict:
    """
    Update the status of multiple committees for a governance record in a single operation.
    
    Args:
        governance_id: The governance ID (e.g., "GOV0002")
        committees: List of committee objects, each containing:
            - committee: The committee type - "committee_1", "committee_2", or "committee_3"
            - status: The status to set - "Approved", "Rejected", or "Pending"
    
    Example:
        update_committee_status(
            governance_id="GOV0002",
            committees=[
                {"committee": "committee_1", "status": "Approved"},
                {"committee": "committee_2", "status": "Approved"}
            ]
        )
    
    Returns:
        Dictionary containing:
            - message: Success/error message
            - data: Updated committee statuses
    """
    # Validate input
    try:
        validated = CommitteeUpdateModel(
            governance_id=governance_id,
            committees=committees
        )
    except ValidationError as e:
        return {"message": "Validation error", "errors": e.errors()}

    # Prepare payload with all committees
    payload = {
        "governance_id": validated.governance_id
    }
    
    # Add each committee status to the payload
    for committee_item in validated.committees:
        payload[committee_item.committee] = committee_item.status
    
    url = f"{API_BASE_URL}/risk-analyse/update-committee"
    
    try:
        # Convert payload to JSON bytes
        data = json.dumps(payload).encode('utf-8')
        
        # Create request with headers
        req = urllib.request.Request(
            url,
            data=data,
            headers={'Content-Type': 'application/json'},
            method='PUT'
        )
        
        # Make the API call with timeout
        with urllib.request.urlopen(req, timeout=10) as response:
            resp_data = json.load(response)
            
            # Broadcast for each committee that was updated
            for committee_item in validated.committees:
                try:
                    broadcast_governance_data(
                        governance_id, 
                        section='commitee_approval', 
                        sub_section=committee_item.committee
                    )
                    print(f"Broadcasted update for {committee_item.committee}")
                except Exception as broadcast_error:
                    print(f"Failed to broadcast for {committee_item.committee}: {broadcast_error}")
            
            return {"message": "Committee statuses updated successfully", "data": resp_data}
    except urllib.error.HTTPError as http_err:
        error_body = http_err.read().decode('utf-8')
        try:
            error_data = json.loads(error_body)
            return {
                "message": f"HTTP Error {http_err.code}: {error_data.get('message', http_err.reason)}",
                "status_code": http_err.code
            }
        except json.JSONDecodeError:
            return {"message": f"HTTP Error {http_err.code}: {http_err.reason}"}
    except urllib.error.URLError as url_err:
        return {"message": f"Connection error: {url_err.reason}"}
    except json.JSONDecodeError as json_err:
        return {"message": f"Failed to parse response: {json_err}"}
    except Exception as ex:
        return {"message": f"Failed to update committee statuses: {ex}"}

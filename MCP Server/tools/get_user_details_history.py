def get_user_details_history(governance_id: str, section: str = 'none') -> dict:
    """
    Retrieve comprehensive governance details including chat history, report, risk, cost, and environment data.
    
    Args:
        governance_id: The governance ID to retrieve details for (e.g., "GOV0006")
        section: Section filter - one of: governance_report, risk_details, commitee_approval, cost_details, environment_details, or none
    
    Returns:
        Dictionary containing all governance-related data aggregated from multiple API endpoints.
    """
    import urllib.request
    import json
    from pydantic import BaseModel, Field, validator
    from typing import Literal
    from config import (
        CHAT_HISTORY_API_URL,
        GOVERNANCE_REPORT_API_URL,
        RISK_DETAILS_API_URL,
        COST_DETAILS_API_URL,
        ENVIRONMENT_DETAILS_API_URL,
        LOCAL_IP
    )
    from websocket_manager import broadcast_governance_details_sync

    # Pydantic model for section validation
    class SectionValidator(BaseModel):
        section: Literal['governance_report', 'risk_details', 'commitee_approval', 'cost_details', 'environment_details', 'none'] = Field(
            default='none',
            description="Section to filter governance details"
        )
    
    # Validate section parameter
    try:
        validated = SectionValidator(section=section)
        validated_section = validated.section
    except Exception as validation_error:
        return {
            "error": f"Invalid section parameter. Must be one of: governance_report, risk_details, commitee_approval, cost_details, environment_details, or none. Error: {str(validation_error)}",
            "governance_id": governance_id
        }
    

    def fetch_api_data(url: str, endpoint_name: str) -> dict:
        """Helper function to fetch data from an API endpoint"""
        try:
            req = urllib.request.Request(url, method='GET')
            with urllib.request.urlopen(req, timeout=10) as resp:
                return json.load(resp)
        except urllib.error.HTTPError as e:
            error_body = e.read().decode('utf-8')
            try:
                error_data = json.loads(error_body)
                return {
                    "error": f"HTTP {e.code}: {error_data.get('message', 'Unknown error')}",
                    "status_code": e.code,
                    "endpoint": endpoint_name
                }
            except json.JSONDecodeError:
                return {
                    "error": f"HTTP {e.code}: {error_body}",
                    "status_code": e.code,
                    "endpoint": endpoint_name
                }
        except Exception as e:
            return {
                "error": f"Error fetching {endpoint_name}: {str(e)}",
                "endpoint": endpoint_name
            }

    try:
        # Fetch data from all API endpoints
        chat_history_url = f"{CHAT_HISTORY_API_URL}/{governance_id}"
        governance_report_url = f"{GOVERNANCE_REPORT_API_URL}/{governance_id}"
        risk_details_url = f"{RISK_DETAILS_API_URL}/{governance_id}"
        cost_details_url = f"{COST_DETAILS_API_URL}/{governance_id}"
        environment_details_url = f"{ENVIRONMENT_DETAILS_API_URL}/{governance_id}"

        print(f"Fetching governance details for: {governance_id}")
        
        # Fetch all data
        chat_history = fetch_api_data(chat_history_url, "chat_history")
        governance_report = fetch_api_data(governance_report_url, "governance_report")
        risk_details = fetch_api_data(risk_details_url, "risk_details")
        cost_details = fetch_api_data(cost_details_url, "cost_details")
        environment_details = fetch_api_data(environment_details_url, "environment_details")

        # Aggregate all data into a single response object
        response_data = {
            "governance_id": governance_id,
            "section": validated_section,
            "chat_history": chat_history,
            "governance_report": governance_report,
            "risk_details": risk_details,
            "cost_details": cost_details,
            "environment_details": environment_details
        }

        # Broadcast the governance details to all connected WebSocket clients
        try:
            broadcast_governance_details_sync(response_data)
            print(f"Governance details broadcasted for governance_id: {governance_id}")
        except Exception as broadcast_error:
            print(f"Failed to broadcast governance details: {broadcast_error}")
            # Continue execution even if broadcast fails
        
        return response_data
    
    except Exception as e:
        return {
            "error": f"Unexpected error: {str(e)}",
            "governance_id": governance_id
        }

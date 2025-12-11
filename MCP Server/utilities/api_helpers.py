"""
API Helper utilities for fetching and broadcasting governance data.
"""
import urllib.request
import json
from typing import Dict


def fetch_api_data(url: str, endpoint_name: str) -> dict:
    """
    Helper function to fetch data from an API endpoint.
    
    Args:
        url: The full URL to fetch data from
        endpoint_name: Name of the endpoint for error reporting
    
    Returns:
        Dictionary containing the API response data or error information
    """
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


def fetch_all_governance_data(governance_id: str, section: str = 'none', sub_section: str = 'none') -> Dict:
    """
    Fetch all governance-related data from multiple API endpoints.
    
    Args:
        governance_id: The governance ID to fetch data for
        section: Section filter for the response
    
    Returns:
        Dictionary containing all governance data aggregated from multiple endpoints
    """
    from config import (
        CHAT_HISTORY_API_URL,
        GOVERNANCE_REPORT_API_URL,
        RISK_DETAILS_API_URL,
        COST_DETAILS_API_URL,
        ENVIRONMENT_DETAILS_API_URL,
        COST_CLARIFICATIONS_API_URL,
        ENVIRONMENT_CLARIFICATIONS_API_URL,
        COMMITTEE_CLARIFICATIONS_API_URL
    )
    
    # Construct API URLs
    chat_history_url = f"{CHAT_HISTORY_API_URL}/{governance_id}"
    governance_report_url = f"{GOVERNANCE_REPORT_API_URL}/{governance_id}"
    risk_details_url = f"{RISK_DETAILS_API_URL}/{governance_id}"
    cost_details_url = f"{COST_DETAILS_API_URL}/{governance_id}"
    environment_details_url = f"{ENVIRONMENT_DETAILS_API_URL}/{governance_id}"
    cost_clarifications_url = f"{COST_CLARIFICATIONS_API_URL}/governance/{governance_id}"
    environment_clarifications_url = f"{ENVIRONMENT_CLARIFICATIONS_API_URL}/governance/{governance_id}"
    committee_clarifications_url = f"{COMMITTEE_CLARIFICATIONS_API_URL}/governance/{governance_id}"

    print(f"Fetching governance details for: {governance_id}")
    
    # Fetch all data
    chat_history = fetch_api_data(chat_history_url, "chat_history")
    governance_report = fetch_api_data(governance_report_url, "governance_report")
    risk_details = fetch_api_data(risk_details_url, "risk_details")
    cost_details = fetch_api_data(cost_details_url, "cost_details")
    environment_details = fetch_api_data(environment_details_url, "environment_details")
    cost_clarifications = fetch_api_data(cost_clarifications_url, "cost_clarifications")
    environment_clarifications = fetch_api_data(environment_clarifications_url, "environment_clarifications")
    committee_clarifications = fetch_api_data(committee_clarifications_url, "committee_clarifications")

    # Aggregate all data into a single response object
    response_data = {
        "governance_id": governance_id,
        "section": section,
        "sub_section": sub_section,
        "chat_history": chat_history,
        "governance_report": governance_report,
        "risk_details": risk_details,
        "cost_details": cost_details,
        "environment_details": environment_details,
        "cost_clarifications": cost_clarifications,
        "environment_clarifications": environment_clarifications,
        "committee_clarifications": committee_clarifications
    }
    
    return response_data


def broadcast_governance_data(governance_id: str, section: str = 'none', sub_section: str = 'none') -> Dict:
    """
    Fetch and broadcast governance data to all connected WebSocket clients.
    
    Args:
        governance_id: The governance ID to fetch and broadcast
        section: Section filter for the response
    
    Returns:
        Dictionary containing the response data that was broadcasted
    """
    from websocket_manager import broadcast_governance_details_sync
    
    # Fetch all governance data
    response_data = fetch_all_governance_data(governance_id, section, sub_section)
    
    # Broadcast the governance details to all connected WebSocket clients
    try:
        broadcast_governance_details_sync(response_data)
        print(f"Governance details broadcasted for governance_id: {governance_id}")
    except Exception as broadcast_error:
        print(f"Failed to broadcast governance details: {broadcast_error}")
        # Continue execution even if broadcast fails
    
    return response_data

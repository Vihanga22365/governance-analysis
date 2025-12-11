def get_cost_clarifications(governance_id: str) -> dict:
    """
    Retrieve cost clarifications for a specific governance ID.
    
    Fetches all cost-related clarification questions and their current status/answers
    including environment preference, PII data, technologies, user count, and architecture.
    
    Args:
        governance_id: The governance ID to retrieve clarifications for (e.g., "GOV0001")
    
    Returns:
        Dictionary containing:
            - message: Success message
            - governanceId: The governance ID
            - data: Clarifications data with array of clarification entries (clarification, unique_code, user_answer, status)
    """
    import urllib.request
    import json
    from config import COST_CLARIFICATIONS_API_URL
    from utilities.api_helpers import broadcast_governance_data
    
    try:
        url = f"{COST_CLARIFICATIONS_API_URL}/governance/{governance_id}"
        req = urllib.request.Request(url, method='GET')
        
        with urllib.request.urlopen(req, timeout=10) as resp:
            response = json.load(resp)
            
            # Broadcast updated governance data to WebSocket clients
            try:
                broadcast_governance_data(governance_id, section='cost_details', sub_section='none')
                print(f"Broadcasted cost clarifications for {governance_id}")
            except Exception as broadcast_error:
                print(f"Failed to broadcast cost clarifications: {broadcast_error}")
            
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
    except Exception as e:
        return {
            "error": f"Error fetching cost clarifications: {str(e)}"
        }

def get_cost_details(governance_id: str) -> dict:
    """
    Retrieve cost estimation details for a specific governance ID.
    
    Fetches comprehensive cost breakdown information including total estimated costs,
    itemized expenses by category, and detailed descriptions.
    
    Args:
        governance_id (str): The governance ID to retrieve cost details for (e.g., "GOV0001").
    
    Returns:
        dict: Dictionary containing cost data with cost_breakdown, cost_details_id,
              created_at, governance_id, total_estimated_cost, user_name, and id fields.
    
    """
    import urllib.request
    import json
    from config import COST_DETAILS_API_URL
    
    try:
        url = f"{COST_DETAILS_API_URL}/{governance_id}"
        req = urllib.request.Request(url, method='GET')
        
        with urllib.request.urlopen(req, timeout=10) as resp:
            response = json.load(resp)
            return response.get('data', [])[0] if response.get('data') else {}
            
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
            "error": f"Error fetching cost details: {str(e)}"
        }

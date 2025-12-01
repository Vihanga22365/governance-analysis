def get_risk_details(governance_id: str) -> dict:
    """
    Retrieve risk analysis details for a specific governance ID.
    
    Fetches comprehensive risk assessment information including risk levels, committee statuses,
    and analysis details.
    
    Args:
        governance_id (str): The governance ID to retrieve risk analysis for (e.g., "GOV0002").
    
    Returns:
        dict: Dictionary containing risk data with committee_1, committee_2, committee_3,
              created_at, governance_id, reason, risk_analysis_id, risk_level, user_name, and id fields.
    """
    import urllib.request
    import json
    from config import RISK_DETAILS_API_URL
    
    try:
        url = f"{RISK_DETAILS_API_URL}/{governance_id}"
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
            "error": f"Error fetching risk details: {str(e)}"
        }

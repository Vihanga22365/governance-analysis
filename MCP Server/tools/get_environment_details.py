def get_environment_details(governance_id: str) -> dict:
    """
    Retrieve environment setup details for a specific governance ID.
    
    Fetches comprehensive environment configuration information including cloud provider,
    services breakdown, and deployment details.
    
    Args:
        governance_id (str): The governance ID to retrieve environment details for (e.g., "GOV0001").
    
    Returns:
        dict: Dictionary containing environment data with created_at, environment,
              environment_breakdown, environment_details_id, governance_id, user_name, and id fields.
    """
    import urllib.request
    import json
    from config import ENVIRONMENT_DETAILS_API_URL
    
    try:
        url = f"{ENVIRONMENT_DETAILS_API_URL}/{governance_id}"
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
            "error": f"Error fetching environment details: {str(e)}"
        }

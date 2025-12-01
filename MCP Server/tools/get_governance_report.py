def get_governance_report(governance_id: str) -> dict:
    """
    Retrieve governance report details for a specific governance ID.
    
    Fetches comprehensive report information including report content, associated documents,
    creation timestamp, and user details.
    
    Args:
        governance_id (str): The governance ID to retrieve report for (e.g., "GOV0002").
    
    Returns:
        dict: Dictionary containing report data with created_at, documents, governance_id,
              report_content, report_id, user_name, and id fields.
    """
    import urllib.request
    import json
    from config import GOVERNANCE_REPORT_API_URL
    
    try:
        url = f"{GOVERNANCE_REPORT_API_URL}/{governance_id}"
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
            "error": f"Error fetching governance report: {str(e)}"
        }

def create_report(
    session_id: str,
    user_name: str,
    report_content: str
) -> dict:
    """
    Create a governance report for a specific session.
    
    Retrieves the governance ID from the session and creates a comprehensive report
    with the provided content.
    
    Args:
        session_id (str): User chat session ID to retrieve governance ID (e.g., "54654-56454-bjhvh").
        user_name (str): Name of the user creating the report (e.g., "John Doe").
        report_content (str): The full report analysis content.
    
    Returns:
        dict: Dictionary containing success message and created report data, or error information.
    """
    import urllib.request
    import json
    from config import GOVERNANCE_API_URL, API_BASE_URL
    
    try:
        # Step 1: Get governance_id from session_id
        session_url = f"{GOVERNANCE_API_URL}/session/{session_id}"
        session_req = urllib.request.Request(session_url, method='GET')
        
        with urllib.request.urlopen(session_req, timeout=10) as session_resp:
            session_data = json.load(session_resp)
            
            if not session_data.get('data') or len(session_data['data']) == 0:
                return {
                    "error": "No governance found for the provided session ID",
                    "session_id": session_id
                }
            
            governance_id = session_data['data'][0].get('governance_id')
            
            if not governance_id:
                return {
                    "error": "Governance ID not found in session data",
                    "session_id": session_id
                }
        
        # Step 2: Create the report
        report_url = f"{API_BASE_URL}/generate-report"
        
        payload = {
            "user_name": user_name,
            "governance_id": governance_id,
            "report_content": report_content
        }
        
        data = json.dumps(payload).encode('utf-8')
        
        report_req = urllib.request.Request(
            report_url,
            data=data,
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        
        with urllib.request.urlopen(report_req, timeout=10) as report_resp:
            return json.load(report_resp)
    
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
    
    except urllib.error.URLError as e:
        from config import LOCAL_IP
        return {
            "error": f"Connection error: {str(e.reason)}. Make sure the API server is running on http://{LOCAL_IP}:3000"
        }
    
    except Exception as e:
        return {
            "error": f"Error creating report: {str(e)}"
        }

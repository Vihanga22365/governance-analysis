def create_report(
    session_id: str,
    user_name: str,
    report_content: str
) -> dict:
    """
    Create a governance report for a specific session.
    
    Retrieves the governance ID from the session and creates a comprehensive report
    with the provided content. Also creates cost and environment clarifications.
    
    Args:
        session_id (str): User chat session ID to retrieve governance ID (e.g., "54654-56454-bjhvh").
        user_name (str): Name of the user creating the report (e.g., "John Doe").
        report_content (str): The full report analysis content.
    
    Returns:
        dict: Dictionary containing success message and created report data, or error information.
    """
    import urllib.request
    import json
    from config import GOVERNANCE_API_URL, API_BASE_URL, COST_CLARIFICATIONS_API_URL, ENVIRONMENT_CLARIFICATIONS_API_URL
    from utilities.api_helpers import broadcast_governance_data
    
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
        
        report_response = None
        with urllib.request.urlopen(report_req, timeout=10) as report_resp:
            report_response = json.load(report_resp)
        
        # Step 3: Create cost clarifications
        try:
            cost_payload = {
                "governance_id": governance_id,
                "user_name": user_name,
                "clarifications": []
            }
            
            cost_data = json.dumps(cost_payload).encode('utf-8')
            cost_req = urllib.request.Request(
                COST_CLARIFICATIONS_API_URL,
                data=cost_data,
                headers={'Content-Type': 'application/json'},
                method='POST'
            )
            
            with urllib.request.urlopen(cost_req, timeout=10) as cost_resp:
                cost_response = json.load(cost_resp)
                print(f"Cost clarifications created for governance_id: {governance_id}")
        
        except urllib.error.HTTPError as cost_error:
            # Log cost clarification error but don't fail the entire operation
            print(f"Warning: Failed to create cost clarifications: {cost_error}")
        except Exception as cost_error:
            # Log cost clarification error but don't fail the entire operation
            print(f"Warning: Error creating cost clarifications: {str(cost_error)}")
        
        # Step 4: Create environment clarifications
        try:
            env_payload = {
                "governance_id": governance_id,
                "user_name": user_name,
                "clarifications": []
            }
            
            env_data = json.dumps(env_payload).encode('utf-8')
            env_req = urllib.request.Request(
                ENVIRONMENT_CLARIFICATIONS_API_URL,
                data=env_data,
                headers={'Content-Type': 'application/json'},
                method='POST'
            )
            
            with urllib.request.urlopen(env_req, timeout=10) as env_resp:
                env_response = json.load(env_resp)
                
                print(f"Environment clarifications created for governance_id: {governance_id}")
        
        except urllib.error.HTTPError as env_error:
            # Log environment clarification error but don't fail the entire operation
            print(f"Warning: Failed to create environment clarifications: {env_error}")
        except Exception as env_error:
            # Log environment clarification error but don't fail the entire operation
            print(f"Warning: Error creating environment clarifications: {str(env_error)}")
        
        # Step 5: Broadcast governance data
        try:
            print(f"Governance details broadcasted for governance_id: {governance_id}")
        except Exception as broadcast_error:
            print(f"Warning: Failed to broadcast governance details: {broadcast_error}")

        
        broadcast_governance_data(governance_id, section='governance_report')
        return report_response
    
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
            "error": f"Connection error: {str(e.reason)}. Make sure the API server is running on http://{LOCAL_IP}:8353"
        }
    
    except Exception as e:
        return {
            "error": f"Error creating report: {str(e)}"
        }

def create_governance_request(
    session_id: str,
    user_name: str,
    use_case_title: str,
    use_case_description: str
) -> dict:
    """
    Create a governance request for risk assessment and compliance tracking.
    
    Args:
        session_id: User chat session ID (UUID format, e.g., "550e8400-e29b-41d4-a716-446655440000")
        user_name: Name of the user creating the request (e.g., "John Doe")
        use_case_title: Title of the use case (e.g., "Risk Assessment")
        use_case_description: Detailed description of the use case and its objectives
    
    Returns:
        Dictionary containing:
            - message: Success message
            - governance_id: Generated governance ID (e.g., "GOV0004")
    """
    import urllib.request
    import json
    from config import GOVERNANCE_API_URL, CHAT_HISTORY_API_URL

    try:
        # API endpoint
        url = GOVERNANCE_API_URL
        
        # Prepare request payload
        payload = {
            "user_chat_session_id": session_id,
            "user_name": user_name,
            "use_case_title": use_case_title,
            "use_case_description": use_case_description,
            "relevant_documents": []
        }
        
        # Convert payload to JSON bytes
        data = json.dumps(payload).encode('utf-8')
        
        # Create request with headers
        req = urllib.request.Request(
            url,
            data=data,
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        
        # Make the API call
        with urllib.request.urlopen(req, timeout=10) as resp:
            response_data = json.load(resp)
            
            # Extract message and governance_id
            message = response_data.get("message", "")
            governance_id = response_data.get("data", {}).get("governance_id", "")
            
            # Save chat history if governance was created successfully
            if governance_id:
                chat_history_payload = {
                    "governance_id": governance_id,
                    "user_chat_session_id": session_id,
                    "user_name": user_name
                }
                
                chat_data = json.dumps(chat_history_payload).encode('utf-8')
                chat_req = urllib.request.Request(
                    CHAT_HISTORY_API_URL,
                    data=chat_data,
                    headers={'Content-Type': 'application/json'},
                    method='POST'
                )
                
                # Make the chat history API call
                with urllib.request.urlopen(chat_req, timeout=10) as chat_resp:
                    json.load(chat_resp)  # Read response but don't need to process it
            
            return {
                "message": message,
                "governance_id": governance_id
            }
    
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
            "error": f"Unexpected error: {str(e)}"
        }

def get_user_chat_history(governance_id: str) -> dict:
    """
    Retrieve chat history for an existing governance request.
    
    Args:
        governance_id: The governance ID to retrieve chat history for (e.g., "GOV0006")
    
    Returns:
        Dictionary containing the chat history JSON object with conversation details.
    """
    import urllib.request
    import json
    from config import CHAT_HISTORY_API_URL

    try:
        # Construct the API endpoint with governance_id
        url = f"{CHAT_HISTORY_API_URL}/{governance_id}"
        
        # Create GET request
        req = urllib.request.Request(url, method='GET')
        
        # Make the API call
        with urllib.request.urlopen(req, timeout=10) as resp:
            response_data = json.load(resp)
            return response_data
    
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
            "error": f"Unexpected error: {str(e)}"
        }

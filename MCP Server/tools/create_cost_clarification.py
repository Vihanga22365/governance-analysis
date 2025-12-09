def create_cost_clarification(
    governance_id: str,
    user_name: str
) -> dict:
    """
    Create cost clarifications for a governance request.
    
    Initializes clarification records for cost-related questions including:
    - Resource Count (DE, QA, PM)
    - Cost per Resource
    - Project Duration
    - Licensed Software Required (JetBrains IntelliJ, Jira, Confluence, GitHub Enterprise)
    
    Args:
        governance_id: The governance ID to create clarifications for (e.g., "GOV0001")
        user_name: Name of the user creating the clarifications (e.g., "Jane Doe")
    
    Returns:
        Dictionary containing:
            - message: Success/error message
            - data: Created clarifications data with governance_id, user_name, and clarifications array
    """
    import urllib.request
    import json
    from config import COST_CLARIFICATIONS_API_URL
    
    try:
        url = COST_CLARIFICATIONS_API_URL
        
        # Prepare request payload
        payload = {
            "governance_id": governance_id,
            "user_name": user_name,
            "clarifications": []
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
    except Exception as e:
        return {
            "error": f"Error creating cost clarifications: {str(e)}"
        }

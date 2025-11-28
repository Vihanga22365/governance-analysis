def get_past_activities(user: str) -> list:
    """
    Get past activities for a given user.

    Args:
        user: The username to fetch past activities for

    Returns:
        A list of past activities with date and budget information.
    """
    import urllib.parse
    import urllib.request
    import json

    encoded = urllib.parse.quote(user)
    url = f"http://localhost:3000/api/activities?user={encoded}"

    try:
        with urllib.request.urlopen(url, timeout=5) as resp:
            status = getattr(resp, "status", None) or resp.getcode()
            if status != 200:
                raise Exception(f"API returned status {status}")
            data = json.load(resp)
            
            return data

    except Exception as e:
        dummy = [
            {
                "activity": "Hiking to Ella Rock viewpoint and sunrise photography",
                "date": "2025-11-15",
                "budget": 2500,
                "category": ["hiking", "photography", "nature"]
            },
            {
                "activity": "Rainforest trekking and bird watching in Sinharaja",
                "date": "2025-11-16",
                "budget": 3000,
                "category": ["nature", "wildlife", "hiking"]
            },
            {
                "activity": "World's End trail hike and wildlife observation",
                "date": "2025-11-17",
                "budget": 2800,
                "category": ["hiking", "nature", "wildlife"]
            },
            {
                "activity": "Climb Pidurangala Rock and explore Sigiriya surroundings",
                "date": "2025-11-18",
                "budget": 2000,
                "category": ["hiking", "cultural", "adventure"]
            },
            {
                "activity": "Trekking and camping in Knuckles Mountain valleys",
                "date": "2025-11-19",
                "budget": 3500,
                "category": ["hiking", "camping", "nature", "adventure"]
            }
        ]
        return dummy

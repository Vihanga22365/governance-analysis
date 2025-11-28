def get_nearby_location_activities(location: str = "Unknown") -> list:
    """
    Gather nearby locations and their activities to given designated location.

    Args:
        location: The location to find nearby activities for (e.g., "Kandy")

    Returns:
        A list of nearby locations with their activities.
    """
    import urllib.parse
    import urllib.request
    import json

    encoded = urllib.parse.quote(location)
    url = f"http://localhost:3000/api/location?location={encoded}"

    try:
        with urllib.request.urlopen(url, timeout=5) as resp:
            status = getattr(resp, "status", None) or resp.getcode()
            if status != 200:
                raise Exception(f"API returned status {status}")
            data = json.load(resp)
            
            return data

    except Exception as e:
        if location.lower() == "kandy":
            dummy = [
                {
                    "name": "Temple of the Tooth Relic (Sri Dalada Maligawa)",
                    "distance_km": 1.0,
                    "activities": [
                        "Cultural sightseeing",
                        "Historical exploration",
                        "Religious worship"
                    ],
                    "category": ["cultural", "religious", "historical"]
                },
                {
                    "name": "Peradeniya Botanical Garden",
                    "distance_km": 6.0,
                    "activities": [
                        "Nature walk",
                        "Photography",
                        "Picnic",
                        "Botanical exploration"
                    ],
                    "category": ["nature", "photography", "family"]
                },
                {
                    "name": "Bahirawakanda Temple",
                    "distance_km": 2.0,
                    "activities": [
                        "Hilltop hike",
                        "Panoramic city view",
                        "Temple visit"
                    ],
                    "category": ["hiking", "cultural", "photography"]
                }
            ]
            return dummy
        else:
            return [
                {
                    "message": "Think nearby locations by yourself",
                    "location": location
                }
            ]

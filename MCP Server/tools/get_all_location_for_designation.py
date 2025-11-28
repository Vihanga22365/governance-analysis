def get_all_location_for_designation(location: str = "Unknown") -> list:
    """
    Get all locations near a designated location.

    Args:
        location: The designated location to find nearby locations for (e.g., "Kandy")

    Returns:
        A list of locations with descriptions including budget and suitable details.
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
                    "location": "Temple of the Tooth Relic (Sri Dalada Maligawa)",
                    "category": ["cultural", "religious", "historical"],
                    "description": "Sacred Buddhist temple housing the relic of the tooth of Buddha. One of the most revered places of worship in Sri Lanka. Perfect for cultural and religious exploration. Budget: 500-1000 LKR (entrance fee). Best visited during morning or evening puja ceremonies. Suitable for families, history enthusiasts, and spiritual travelers. Allow 2-3 hours for complete visit including museum."
                },
                {
                    "location": "Peradeniya Botanical Garden",
                    "category": ["nature", "photography", "family"],
                    "description": "Stunning 147-acre royal botanical garden featuring over 4000 species of plants including orchids, spices, and medicinal plants. Famous for the giant Javan fig tree and bamboo collection. Budget: 1500-2500 LKR (entrance fee plus refreshments). Ideal for nature lovers, photographers, families, and couples. Perfect for picnics and leisurely walks. Allow 3-4 hours to explore fully."
                },
                {
                    "location": "Bahirawakanda Vihara Buddha Statue",
                    "category": ["cultural", "photography", "hiking"],
                    "description": "Giant white Buddha statue overlooking Kandy city from a hilltop location. Offers breathtaking panoramic views of the entire city and surrounding mountains. Budget: Free entry, 200-500 LKR for transportation. Best visited during sunset for spectacular views. Suitable for photography enthusiasts and sightseers. Quick visit of 1-2 hours. Moderate climb required."
                },
                {
                    "location": "Udawattakele Forest Reserve",
                    "category": ["nature", "wildlife", "hiking"],
                    "description": "Historic forest sanctuary and biodiversity hotspot in the heart of Kandy. Features diverse flora, fauna including monkeys, and ancient Buddhist meditation sites. Budget: 300-800 LKR (entrance fee). Perfect for nature walks, bird watching, and trekking. Suitable for adventure seekers and wildlife enthusiasts. Allow 2-4 hours. Wear comfortable hiking shoes."
                },
                {
                    "location": "Kandy Lake (Bogambara Lake)",
                    "category": ["nature", "family", "relaxation"],
                    "description": "Scenic artificial lake in the heart of Kandy city, created by the last Kandyan monarch. Perfect for peaceful evening walks along the well-maintained 3.5 km circular path. Budget: Free, 500-1500 LKR for lakeside cafes. Ideal for romantic walks, jogging, and relaxation. Best visited during early morning or evening. Suitable for all ages. Allow 1-2 hours."
                },
                {
                    "location": "Royal Palace of Kandy",
                    "category": ["cultural", "historical", "photography"],
                    "description": "Historic palace complex showcasing Kandyan architecture and colonial history. Houses the National Museum with royal regalia, jewelry, and artifacts. Budget: 500-1000 LKR (entrance fee). Excellent for history buffs and cultural enthusiasts. Combined visit with Temple of the Tooth recommended. Allow 1-2 hours. Photography permitted in most areas."
                },
                {
                    "location": "Kandy Garrison Cemetery",
                    "category": ["historical", "cultural"],
                    "description": "Historic colonial cemetery dating to 1817, featuring well-preserved British-era graves and monuments. Peaceful garden setting with beautiful landscaping and historical significance. Budget: Free entry, donations appreciated. Suitable for history enthusiasts and those interested in colonial heritage. Quiet and reflective atmosphere. Allow 30-60 minutes. Best visited during morning hours."
                },
                {
                    "location": "Knuckles Mountain Range",
                    "category": ["hiking", "nature", "adventure", "camping"],
                    "description": "UNESCO World Heritage Site with dramatic landscapes, cloud forests, and diverse ecosystems. Named for its resemblance to a clenched fist. Features 34 peaks, cascading waterfalls, and remote villages. Budget: 2000-5000 LKR (permits, guide, and transportation). Perfect for serious trekkers and nature photographers. Multi-day camping treks available. Moderate to challenging difficulty. Best visited November to March."
                },
                {
                    "location": "Riverston Peak and Pitawala Pathana",
                    "category": ["hiking", "nature", "photography"],
                    "description": "Stunning mini-world's end with sheer cliff drops and expansive grassland plateau. Part of Knuckles range offering breathtaking views of surrounding valleys and tea estates. Budget: 1500-3500 LKR (transportation and guide). Ideal for day hikers and landscape photographers. Moderate trek of 3-4 hours. Cool climate year-round. Watch for endemic wildlife and birds."
                },
                {
                    "location": "Dunhinda Falls Forest Trail",
                    "category": ["nature", "hiking", "photography"],
                    "description": "Magnificent 64-meter waterfall cascading through dense rainforest near Badulla. Scenic forest trail along Badulu Oya river with rich biodiversity. Budget: 500-1500 LKR (entrance and refreshments). Perfect for nature walks and waterfall photography. Easy to moderate 1 km trail taking 1-2 hours. Best visited during rainy season for maximum flow. Swimming not recommended due to strong currents."
                },
                {
                    "location": "Corbett's Gap and Dothalugala Peak",
                    "category": ["hiking", "nature", "wildlife", "adventure"],
                    "description": "Misty mountain pass at 1800m altitude leading to Sri Lanka's 7th highest peak. Features pristine cloud forests, rare endemic species, and panoramic mountain views. Budget: 2500-4500 LKR (permits, guide, and 4WD transport). Ideal for serious hikers and birdwatchers. Full day trek (6-8 hours). Often shrouded in clouds adding mystical atmosphere. Best accessed October to April."
                },
                {
                    "location": "Victoria-Randenigala-Rantambe Forest Reserve",
                    "category": ["nature", "wildlife", "photography"],
                    "description": "Expansive forest reserve surrounding three major reservoirs with rich wildlife including elephants, leopards, and endemic birds. Features forest trails, boat safaris, and wildlife observation points. Budget: 1000-3000 LKR (entrance, boat rides optional). Perfect for wildlife enthusiasts and birdwatchers. Half to full day visit. Early morning best for wildlife sightings. Photography paradise with lake and forest vistas."
                }
            ]
            return dummy
        else:
            return [
                {
                    "message": "Think locations by yourself",
                    "location": location
                }
            ]

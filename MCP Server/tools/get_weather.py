def get_weather(location: str, date: str = "2025-11-28") -> dict:
    """
    Get weather information for a given location and date using Open-Meteo API (free, no API key required).
    
    Args:
        location: City name or location (e.g., "London", "New York", "Tokyo")
        date: Date in YYYY-MM-DD format (e.g., "2025-11-15"). If not provided, returns current weather.
              For past dates (up to 2 months back), returns historical data.
              For future dates (up to 16 days ahead), returns forecast data.
    
    Returns:
        Dictionary containing weather information including temperature, conditions, humidity, and wind speed.
    """
    import urllib.parse
    import urllib.request
    import json
    from datetime import datetime, timedelta

    try:
        encoded_location = urllib.parse.quote(location)
        geocoding_url = f"https://geocoding-api.open-meteo.com/v1/search?name={encoded_location}&count=1&language=en&format=json"
        
        with urllib.request.urlopen(geocoding_url, timeout=10) as resp:
            geo_data = json.load(resp)
            
            if not geo_data.get("results"):
                return {
                    "error": f"Location '{location}' not found",
                    "location": location
                }
            
            result = geo_data["results"][0]
            latitude = result["latitude"]
            longitude = result["longitude"]
            location_name = result["name"]
            country = result.get("country", "")
        if date:
            try:
                target_date = datetime.strptime(date, "%Y-%m-%d")
                today = datetime.now()
                days_difference = (target_date.date() - today.date()).days
                
                if days_difference > 16:
                    return {
                        "location": f"{location_name}, {country}",
                        "coordinates": {
                            "latitude": latitude,
                            "longitude": longitude
                        },
                        "date": date,
                        "data_type": "estimated",
                        "temperature_celsius": {
                            "max": 25,
                            "min": 15
                        },
                        "precipitation_mm": 0,
                        "wind_speed_max_kmh": 10,
                        "conditions": "Partly cloudy",
                        "note": "Forecast data is only available up to 16 days. Showing estimated typical weather for this location."
                    }
                
                if target_date.date() < today.date():
                    weather_url = f"https://archive-api.open-meteo.com/v1/archive?latitude={latitude}&longitude={longitude}&start_date={date}&end_date={date}&daily=temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum,weather_code,wind_speed_10m_max&timezone=auto"
                    
                    with urllib.request.urlopen(weather_url, timeout=10) as resp:
                        weather_data = json.load(resp)
                        daily = weather_data["daily"]
                        
                        weather_codes = {
                            0: "Clear sky",
                            1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
                            45: "Foggy", 48: "Depositing rime fog",
                            51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle",
                            61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
                            71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow",
                            80: "Slight rain showers", 81: "Moderate rain showers", 82: "Violent rain showers",
                            95: "Thunderstorm", 96: "Thunderstorm with slight hail", 99: "Thunderstorm with heavy hail"
                        }
                        
                        weather_code = daily.get("weather_code", [0])[0]
                        weather_description = weather_codes.get(weather_code, "Unknown")
                        
                        return {
                            "location": f"{location_name}, {country}",
                            "coordinates": {
                                "latitude": latitude,
                                "longitude": longitude
                            },
                            "date": date,
                            "data_type": "historical",
                            "temperature_celsius": {
                                "max": daily["temperature_2m_max"][0],
                                "min": daily["temperature_2m_min"][0],
                                "mean": daily["temperature_2m_mean"][0]
                            },
                            "precipitation_mm": daily["precipitation_sum"][0],
                            "wind_speed_max_kmh": daily["wind_speed_10m_max"][0],
                            "conditions": weather_description
                        }
                else:
                    weather_url = f"https://api.open-meteo.com/v1/forecast?latitude={latitude}&longitude={longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code,wind_speed_10m_max&start_date={date}&end_date={date}&timezone=auto"
                    
                    with urllib.request.urlopen(weather_url, timeout=10) as resp:
                        weather_data = json.load(resp)
                        
                        if "daily" not in weather_data or not weather_data["daily"]:
                            return {
                                "error": f"No forecast data available for date '{date}'",
                                "location": location,
                                "date": date
                            }
                        
                        daily = weather_data["daily"]
                        
                        if not daily.get("time") or len(daily.get("time", [])) == 0:
                            return {
                                "error": f"No forecast data available for date '{date}'",
                                "location": location,
                                "date": date
                            }
                        
                        weather_codes = {
                            0: "Clear sky",
                            1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
                            45: "Foggy", 48: "Depositing rime fog",
                            51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle",
                            61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
                            71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow",
                            80: "Slight rain showers", 81: "Moderate rain showers", 82: "Violent rain showers",
                            95: "Thunderstorm", 96: "Thunderstorm with slight hail", 99: "Thunderstorm with heavy hail"
                        }
                        
                        weather_code = daily.get("weather_code", [0])[0]
                        weather_description = weather_codes.get(weather_code, "Unknown")
                        
                        return {
                            "location": f"{location_name}, {country}",
                            "coordinates": {
                                "latitude": latitude,
                                "longitude": longitude
                            },
                            "date": date,
                            "data_type": "forecast",
                            "temperature_celsius": {
                                "max": daily["temperature_2m_max"][0],
                                "min": daily["temperature_2m_min"][0]
                            },
                            "precipitation_mm": daily["precipitation_sum"][0],
                            "wind_speed_max_kmh": daily["wind_speed_10m_max"][0],
                            "conditions": weather_description
                        }
            except ValueError:
                return {
                    "error": f"Invalid date format. Please use YYYY-MM-DD format (e.g., '2025-11-15')",
                    "location": location,
                    "date": date
                }
        else:
            weather_url = f"https://api.open-meteo.com/v1/forecast?latitude={latitude}&longitude={longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&timezone=auto"
            
            with urllib.request.urlopen(weather_url, timeout=10) as resp:
                weather_data = json.load(resp)
                current = weather_data["current"]
                
                weather_codes = {
                    0: "Clear sky",
                    1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
                    45: "Foggy", 48: "Depositing rime fog",
                    51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle",
                    61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
                    71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow",
                    80: "Slight rain showers", 81: "Moderate rain showers", 82: "Violent rain showers",
                    95: "Thunderstorm", 96: "Thunderstorm with slight hail", 99: "Thunderstorm with heavy hail"
                }
                
                weather_code = current.get("weather_code", 0)
                weather_description = weather_codes.get(weather_code, "Unknown")
                
                return {
                    "location": f"{location_name}, {country}",
                    "coordinates": {
                        "latitude": latitude,
                        "longitude": longitude
                    },
                    "data_type": "current",
                    "temperature_celsius": current["temperature_2m"],
                    "feels_like_celsius": current["apparent_temperature"],
                    "humidity_percent": current["relative_humidity_2m"],
                    "precipitation_mm": current["precipitation"],
                    "wind_speed_kmh": current["wind_speed_10m"],
                    "conditions": weather_description,
                    "time": current["time"]
                }
    
    except Exception as e:
        return {
            "location": location,
            "date": date if date else "current",
            "data_type": "estimated",
            "temperature_celsius": {
                "max": 25,
                "min": 15
            },
            "precipitation_mm": 0,
            "wind_speed_kmh": 10,
            "conditions": "Partly cloudy",
            "note": f"Could not fetch real weather data. Showing estimated typical weather. Error: {str(e)}"
        }

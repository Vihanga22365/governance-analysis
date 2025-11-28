def validate_future_date(date: str) -> dict:
    """
    Validate that a date is in the future and within the next 6 months from today.

    Args:
        date: Date string in YYYY-MM-DD format to validate (e.g., "2025-12-25")

    Returns:
        Dictionary containing validation result with status, message, and date details.
    """
    from datetime import datetime, timedelta

    try:
        # Parse the input date
        input_date = datetime.strptime(date, "%Y-%m-%d")
        today = datetime.now()
        
        # Calculate the difference in days
        days_difference = (input_date.date() - today.date()).days
        
        # Calculate 6 months from today (approximately 180 days)
        six_months_later = today + timedelta(days=180)
        
        # Validation checks
        if days_difference < 0:
            return {
                "valid": False,
                "status": "past_date",
                "message": f"The date '{date}' is in the past. Please provide a future date.",
                "input_date": date,
                "today": today.strftime("%Y-%m-%d"),
                "days_difference": days_difference,
                "valid_range_start": today.strftime("%Y-%m-%d"),
                "valid_range_end": six_months_later.strftime("%Y-%m-%d")
            }
        
        if days_difference == 0:
            return {
                "valid": False,
                "status": "today",
                "message": f"The date '{date}' is today. Please provide a future date (tomorrow or later).",
                "input_date": date,
                "today": today.strftime("%Y-%m-%d"),
                "days_difference": days_difference,
                "valid_range_start": (today + timedelta(days=1)).strftime("%Y-%m-%d"),
                "valid_range_end": six_months_later.strftime("%Y-%m-%d")
            }
        
        if days_difference > 180:
            return {
                "valid": False,
                "status": "too_far_future",
                "message": f"The date '{date}' is {days_difference} days ahead, which exceeds the 6-month (180 days) limit. Please choose a date within the next 6 months.",
                "input_date": date,
                "today": today.strftime("%Y-%m-%d"),
                "days_difference": days_difference,
                "valid_range_start": (today + timedelta(days=1)).strftime("%Y-%m-%d"),
                "valid_range_end": six_months_later.strftime("%Y-%m-%d")
            }
        
        # Date is valid
        return {
            "valid": True,
            "status": "valid",
            "message": f"The date '{date}' is valid. It is {days_difference} days in the future.",
            "input_date": date,
            "today": today.strftime("%Y-%m-%d"),
            "days_difference": days_difference,
            "valid_range_start": (today + timedelta(days=1)).strftime("%Y-%m-%d"),
            "valid_range_end": six_months_later.strftime("%Y-%m-%d"),
            "weeks_ahead": round(days_difference / 7, 1),
            "months_ahead": round(days_difference / 30, 1)
        }
        
    except ValueError as e:
        return {
            "valid": False,
            "status": "invalid_format",
            "message": f"Invalid date format. Please use YYYY-MM-DD format (e.g., '2025-12-25'). Error: {str(e)}",
            "input_date": date,
            "today": datetime.now().strftime("%Y-%m-%d")
        }
    except Exception as e:
        return {
            "valid": False,
            "status": "error",
            "message": f"An error occurred while validating the date: {str(e)}",
            "input_date": date
        }

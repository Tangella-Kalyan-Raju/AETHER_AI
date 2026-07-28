from datetime import datetime

class CalendarService:
    @staticmethod
    def get_current_season_context() -> str:
        now = datetime.now()
        month = now.month
        # Simulate a calendar API checking for active festival seasons
        # Autumn/Winter months in India are typically peak festival seasons (e.g., Diwali, Dussehra)
        if month in [9, 10, 11, 12]:
            return "Active Festival Season (Peak Demand Phase). Residential and commercial illumination levels are significantly elevated."
        return "Standard Operational Calendar Season."

calendar_service = CalendarService()

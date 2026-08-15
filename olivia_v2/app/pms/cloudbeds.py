from typing import Any
import httpx
from olivia_v2.app.config import Settings


class CloudbedsClient:
    def __init__(self, settings: Settings):
        self.settings = settings

    async def get_rates(self, check_in: str | None, check_out: str | None) -> list[dict[str, Any]]:
        if not check_in or not check_out:
            return []
        if self.settings.demo_mode:
            return self._mock_rates()
        if not (self.settings.cloudbeds_api_key or self.settings.cloudbeds_access_token):
            return []

        url = f"{self.settings.cloudbeds_api_base.rstrip('/')}/getRatePlans"
        headers = {}
        if self.settings.cloudbeds_access_token:
            headers["Authorization"] = f"Bearer {self.settings.cloudbeds_access_token}"
        elif self.settings.cloudbeds_api_key:
            headers["x-api-key"] = self.settings.cloudbeds_api_key

        params = {
            "propertyID": self.settings.cloudbeds_property_id,
            "startDate": check_in,
            "endDate": check_out,
            "detailedRates": "true",
        }

        try:
            async with httpx.AsyncClient(timeout=12) as client:
                response = await client.get(url, headers=headers, params=params)
                if response.status_code >= 400:
                    return []
                data = response.json()
                return data.get("data") if isinstance(data.get("data"), list) else []
        except (httpx.HTTPError, TypeError, ValueError):
            return []

    def _mock_rates(self) -> list[dict[str, Any]]:
        return [
            {
                "roomTypeName": "Estudio",
                "roomsAvailable": 2,
                "roomRate": 1850,
                "totalRate": 3700,
                "currency": "MXN",
            },
            {
                "roomTypeName": "Suite",
                "roomsAvailable": 1,
                "roomRate": 2250,
                "totalRate": 4500,
                "currency": "MXN",
            },
            {
                "roomTypeName": "Suite Doble",
                "roomsAvailable": 1,
                "roomRate": 2850,
                "totalRate": 5700,
                "currency": "MXN",
            },
        ]

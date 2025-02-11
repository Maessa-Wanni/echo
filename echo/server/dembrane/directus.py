from logging import getLogger

from directus_sdk_py import DirectusClient  # type: ignore

from dembrane.config import DIRECTUS_TOKEN, DIRECTUS_BASE_URL

logger = getLogger(__name__)

logger.error("PLEASE CHANGE THIS IT IS HARDCODED for the hackathon")
directus = DirectusClient(url=DIRECTUS_BASE_URL, token="Xdk9sYZaed8yER0sZE2AYW_OqGBuTw12")

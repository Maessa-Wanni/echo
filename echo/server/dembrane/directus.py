from logging import getLogger

from directus_sdk_py import DirectusClient  # type: ignore

from dembrane.config import DIRECTUS_BASE_URL, DIRECTUS_TOKEN

logger = getLogger(__name__)

directus = DirectusClient(url=DIRECTUS_BASE_URL, token=DIRECTUS_TOKEN)

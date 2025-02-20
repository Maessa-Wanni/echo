from logging import getLogger

from fastapi import (
    APIRouter,
)


# dembrane/api/api.py
from dembrane.api import audio, text  # Import the new modules along with existing ones if any
from dembrane.api.chat import ChatRouter
from dembrane.api.static import StaticRouter
from dembrane.api.project import ProjectRouter
from dembrane.api.resource import ResourceRouter
from dembrane.api.stateless import StatelessRouter
from dembrane.api.participant import ParticipantRouter
from dembrane.api.conversation import ConversationRouter


logger = getLogger("api")

api = APIRouter()


@api.get("/health")
async def health() -> dict:
    return {"status": "ok"}


api.include_router(ChatRouter, prefix="/chats")
api.include_router(StaticRouter, prefix="/static")
api.include_router(ProjectRouter, prefix="/projects")
api.include_router(ResourceRouter, prefix="/resources")
api.include_router(ParticipantRouter, prefix="/participant")
api.include_router(ConversationRouter, prefix="/conversations")
api.include_router(StatelessRouter, prefix="/stateless")

# Add the new endpoints
api.include_router(audio.router, prefix="/audio", tags=["Audio"])
api.include_router(text.router, prefix="/text", tags=["Text"])
import logging
from os import path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from dembrane.config import IMAGES_DIR

StaticRouter = APIRouter()

logger = logging.getLogger("static")


@StaticRouter.get("/image/{image_path}")
async def get_image(image_path: str) -> FileResponse:
    logger.info("Getting image %s", image_path)

    # Validate path for security
    if any(c in image_path for c in ["..", "~", "/", "\\"]):
        raise HTTPException(
            status_code=400,
            detail="Invalid image path",
        )

    # Only allow specific image extensions
    allowed_extensions = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
    if not any(image_path.lower().endswith(ext) for ext in allowed_extensions):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type",
        )

    file_path = path.join(IMAGES_DIR, image_path)

    # Ensure the resolved path is within IMAGES_DIR
    try:
        real_path = path.realpath(file_path)
        if not real_path.startswith(path.realpath(IMAGES_DIR)):
            raise HTTPException(
                status_code=400,
                detail="Invalid image path",
            )
    except Exception as e:
        logger.error("Error validating image path: %s", e)
        raise HTTPException(
            status_code=400,
            detail="Invalid image path",
        ) from e

    if not path.exists(file_path):
        raise HTTPException(
            status_code=404,
            detail="Image not found",
        )

    return FileResponse(file_path)

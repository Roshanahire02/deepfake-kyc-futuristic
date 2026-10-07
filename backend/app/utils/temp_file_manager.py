"""
Temporary-file lifecycle helpers.

RAW KYC VIDEOS AND DOCUMENT IMAGES ARE NEVER PERSISTED PERMANENTLY.
Everything written here lives under settings.TEMP_VIDEO_DIR /
settings.UPLOAD_DIR and is deleted once the corresponding pipeline
stage finishes reading it. Only structured metadata/results
(scores, statuses, extracted text) are written to PostgreSQL.
"""
import os
import shutil
import uuid

from app.core.config import settings
from app.utils.logging_config import logger


def ensure_dirs() -> None:
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    os.makedirs(settings.TEMP_VIDEO_DIR, exist_ok=True)
    os.makedirs(settings.MODEL_DIR, exist_ok=True)


def save_temp_bytes(raw_bytes: bytes, directory: str, suffix: str) -> str:
    ensure_dirs()
    filename = f"{uuid.uuid4().hex}{suffix}"
    path = os.path.join(directory, filename)
    with open(path, "wb") as f:
        f.write(raw_bytes)
    return path


def delete_path(path: str) -> None:
    try:
        if path and os.path.isfile(path):
            os.remove(path)
            logger.info(f"Deleted temporary file: {path}")
        elif path and os.path.isdir(path):
            shutil.rmtree(path, ignore_errors=True)
            logger.info(f"Deleted temporary directory: {path}")
    except OSError as e:
        logger.warning(f"Failed to delete temp path {path}: {e}")

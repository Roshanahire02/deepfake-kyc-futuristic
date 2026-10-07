"""
Central application configuration.

All secrets and environment-specific values are read from environment
variables (via a local .env file, see .env.example). Nothing here is
hard-coded, and risk thresholds are configurable rather than fixed
constants baked into the pipeline logic.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Database
    DATABASE_URL: str = "sqlite:///./storage/kyc.db"

    # Auth
    JWT_SECRET_KEY: str = "dev-secret-change-me"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Storage
    UPLOAD_DIR: str = "./storage/uploads"
    TEMP_VIDEO_DIR: str = "./storage/temp_video"
    MODEL_DIR: str = "./storage/models"
    MAX_UPLOAD_MB: int = 10

    # Risk engine thresholds - configurable, read at runtime
    RISK_LOW_MAX: int = 30
    RISK_MEDIUM_MAX: int = 70
    FACE_MATCH_THRESHOLD: float = 0.55

    # CORS
    FRONTEND_ORIGIN: str = "http://localhost:5173"

    # ML behaviour
    DEEPFAKE_FRAME_SAMPLE_RATE: int = 5  # analyze every Nth frame
    DEEPFAKE_MAX_FRAMES: int = 30
    LIVENESS_EAR_BLINK_THRESHOLD: float = 0.21  # eye-aspect-ratio threshold for a blink

    # rPPG (remote photoplethysmography) -- physiological liveness signal.
    # All thresholds configurable rather than scattered as magic numbers.
    RPPG_MIN_FRAMES: int = 40                 # below this, too short a clip to trust any estimate
    RPPG_MIN_FACE_DETECTION_RATIO: float = 0.6  # fraction of frames that must have a usable forehead ROI
    RPPG_MIN_SIGNAL_QUALITY: float = 0.35     # below this, report INSUFFICIENT_SIGNAL rather than a number
    RPPG_MIN_BPM: float = 40.0                # physiological heart-rate search band (resting-to-elevated)
    RPPG_MAX_BPM: float = 180.0
    RPPG_DEFAULT_FPS_FALLBACK: float = 15.0   # used only if the container/codec doesn't report a valid fps
    RPPG_METHOD: str = "CHROM"


settings = Settings()

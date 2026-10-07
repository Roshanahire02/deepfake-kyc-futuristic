"""
GET /api/system/models

Reports the real, current status of every ML component. Never
fabricates "Loaded"/accuracy claims -- statuses are derived from
whether an actual checkpoint file exists on disk, exactly as the
inference modules themselves check.
"""
from __future__ import annotations

import os

from fastapi import APIRouter

from app.core.config import settings

router = APIRouter(prefix="/api/system", tags=["system"])


@router.get("/models")
def model_status():
    deepfake_ckpt = os.path.isfile(os.path.join(settings.MODEL_DIR, "deepfake_effnet.pt"))
    risk_ckpt = os.path.isfile(os.path.join(settings.MODEL_DIR, "risk_model.joblib"))

    def _installed(module_name: str) -> bool:
        try:
            __import__(module_name)
            return True
        except ImportError:
            return False

    has_easyocr = _installed("easyocr")
    has_insightface = _installed("insightface")
    has_mediapipe = _installed("mediapipe")
    has_torch = _installed("torch")
    has_scipy = _installed("scipy")

    return [
        {
            "model": "Document OCR (EasyOCR)",
            "status": "Pre-trained, installed and available" if has_easyocr else "NOT INSTALLED in this environment -- pipeline is fully implemented, install easyocr+torch per requirements.txt to enable",
            "version": "easyocr-en",
            "purpose": "Extract text fields from identity documents",
            "device": "CPU",
        },
        {
            "model": "Document Tampering Baseline",
            "status": "Rule-based (ELA + noise + copy-move), not a trained classifier -- available (OpenCV only)",
            "version": "cv_heuristic_v1",
            "purpose": "Flag possible document tampering/forgery",
            "device": "CPU",
        },
        {
            "model": "Face Detection (MediaPipe)",
            "status": "Pre-trained, installed and available" if has_mediapipe else "NOT INSTALLED in this environment",
            "version": "mediapipe-face-detection",
            "purpose": "Locate faces in ID photo and live frames",
            "device": "CPU",
        },
        {
            "model": "Face Recognition (InsightFace / ArcFace)",
            "status": "Pre-trained, installed and available" if has_insightface else "NOT INSTALLED in this environment -- pipeline is fully implemented, install insightface+onnxruntime per requirements.txt to enable",
            "version": "buffalo_l",
            "purpose": "Generate face embeddings for identity matching",
            "device": "CPU",
        },
        {
            "model": "Liveness Detection",
            "status": (
                "Rule-based (EAR blink + head-turn displacement), available"
                if has_mediapipe
                else "Rule-based, but NOT INSTALLED in this environment (needs mediapipe)"
            ),
            "version": "landmark_heuristic_v1",
            "purpose": "Verify blink/head-turn challenge-response",
            "device": "CPU",
        },
        {
            "model": "rPPG (Remote Photoplethysmography)",
            "status": (
                "Rule-based signal processing (CHROM method), available"
                if (has_mediapipe and has_scipy)
                else f"NOT INSTALLED in this environment (needs {'mediapipe' if not has_mediapipe else ''}"
                     f"{' and ' if not has_mediapipe and not has_scipy else ''}{'scipy' if not has_scipy else ''})"
            ),
            "version": "chrom_v1",
            "purpose": "Physiological pulse signal as a supplementary liveness check -- one signal among several, not a standalone deepfake/spoof detector",
            "device": "CPU",
        },
        {
            "model": "Deepfake Detection (EfficientNet-B0)",
            "status": (
                ("Fine-tuned checkpoint loaded" if deepfake_ckpt else
                 "TRAINING REQUIRED -- ImageNet-pretrained backbone with an UNTRAINED head; forward pass is real but not yet meaningful for deepfake detection")
                if has_torch else "NOT INSTALLED in this environment -- pipeline is fully implemented, install torch+torchvision per requirements.txt to enable"
            ),
            "version": "efficientnet_b0_finetuned_v1" if deepfake_ckpt else "efficientnet_b0_imagenet_untuned",
            "purpose": "Estimate probability that video frames are manipulated",
            "device": "CPU",
        },
        {
            "model": "Replay Attack Detection",
            "status": "Rule-based (moire/FFT + temporal consistency + loop periodicity), available (OpenCV only)",
            "version": "replay_heuristic_v1",
            "purpose": "Detect screen replay / pre-recorded video presentation",
            "device": "CPU",
        },
        {
            "model": "Fraud Risk Engine",
            "status": "Trained on synthetic data, available" if risk_ckpt else "TRAINING REQUIRED -- falling back to a transparent weighted-rule baseline (not a trained model)",
            "version": "xgboost_risk_v1_synthetic" if risk_ckpt else "rule_based_fallback_untrained",
            "purpose": "Combine all upstream signals into a single 0-100 fraud risk score",
            "device": "CPU",
        },
    ]


@router.get("/health")
def health():
    return {"status": "ok"}

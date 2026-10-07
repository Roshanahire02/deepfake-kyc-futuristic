"""Decode an uploaded video clip into BGR frames (+fps) for the ML pipeline."""
from __future__ import annotations

from typing import List, Tuple

import cv2
import numpy as np
from fastapi import HTTPException


def extract_frames(video_path: str, max_frames: int = 90) -> Tuple[List[np.ndarray], float]:
    """
    Returns (frames, fps). fps is whatever the container reports via
    OpenCV; callers (e.g. app/ml/rppg.py) must tolerate 0/None/garbage
    values from unusual codecs and fall back to a configured default
    rather than dividing by zero or producing a bogus BPM conversion.
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise HTTPException(status_code=400, detail="Could not open uploaded video file.")
    frames: List[np.ndarray] = []
    try:
        fps = cap.get(cv2.CAP_PROP_FPS) or 0.0
        while len(frames) < max_frames:
            ok, frame = cap.read()
            if not ok:
                break
            frames.append(frame)
    finally:
        cap.release()
    if not frames:
        raise HTTPException(status_code=400, detail="No frames could be decoded from the uploaded video.")
    return frames, fps

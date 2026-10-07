"""
Trains the fraud-risk model (Model F) on the synthetic dataset produced
by generate_synthetic_data.py, with a proper train/validation/test
split to avoid data leakage, and saves a joblib bundle that
app/ml/risk_engine.py loads at inference time.

Tries XGBoost first (more capacity, native SHAP TreeExplainer support);
falls back to Logistic Regression (fully transparent, coefficients are
directly interpretable) if xgboost isn't installed.

Usage:
    python generate_synthetic_data.py --n 8000 --out synthetic_risk_data.csv
    python train_risk_model.py --data synthetic_risk_data.csv --out ../../backend/storage/models/risk_model.joblib
"""
import argparse
import os

import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split

FEATURES = [
    "document_authenticity_score",
    "tampering_probability",
    "face_similarity",
    "face_quality",
    "liveness_passed",
    "deepfake_probability",
    "replay_probability",
]


def train(data_path: str, out_path: str):
    df = pd.read_csv(data_path)
    X = df[FEATURES]
    y = df["label"]

    # 70/15/15 train/val/test split, stratified to keep fraud-rate balance across splits
    X_train, X_temp, y_train, y_temp = train_test_split(X, y, test_size=0.3, stratify=y, random_state=42)
    X_val, X_test, y_val, y_test = train_test_split(X_temp, y_temp, test_size=0.5, stratify=y_temp, random_state=42)

    model_kind = "logistic_regression"
    # The synthetic fraud rate is intentionally low (realistic base rate),
    # so we correct for class imbalance rather than letting the model
    # default to always predicting "not fraud".
    scale_pos_weight = (y_train == 0).sum() / max((y_train == 1).sum(), 1)
    try:
        import xgboost as xgb

        model = xgb.XGBClassifier(
            n_estimators=200,
            max_depth=4,
            learning_rate=0.08,
            subsample=0.9,
            colsample_bytree=0.9,
            eval_metric="logloss",
            scale_pos_weight=scale_pos_weight,
            random_state=42,
        )
        model.fit(X_train, y_train, eval_set=[(X_val, y_val)], verbose=False)
        model_kind = "xgboost"
    except ImportError:
        model = LogisticRegression(max_iter=1000, class_weight="balanced")
        model.fit(X_train, y_train)

    def evaluate(split_name, X_split, y_split):
        preds = model.predict(X_split)
        proba = model.predict_proba(X_split)[:, 1]
        print(f"\n--- {split_name} ({len(X_split)} rows) ---")
        print(f"Accuracy:  {accuracy_score(y_split, preds):.4f}")
        print(f"Precision: {precision_score(y_split, preds, zero_division=0):.4f}")
        print(f"Recall:    {recall_score(y_split, preds, zero_division=0):.4f}")
        print(f"F1:        {f1_score(y_split, preds, zero_division=0):.4f}")
        print(f"ROC-AUC:   {roc_auc_score(y_split, proba):.4f}")
        print(f"Confusion matrix:\n{confusion_matrix(y_split, preds)}")

    evaluate("VALIDATION", X_val, y_val)
    evaluate("TEST", X_test, y_test)

    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    joblib.dump(
        {
            "model": model,
            "model_kind": model_kind,
            "features": FEATURES,
            "version": "trained_on_synthetic_data_v1",
            "note": "Trained on SYNTHETIC data only. Metrics above reflect performance on the synthetic "
            "rule described in generate_synthetic_data.py, not real-world fraud detection.",
        },
        out_path,
    )
    print(f"\nSaved model bundle ({model_kind}) to {out_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", type=str, default="synthetic_risk_data.csv")
    parser.add_argument("--out", type=str, default="../../backend/storage/models/risk_model.joblib")
    args = parser.parse_args()
    train(args.data, args.out)

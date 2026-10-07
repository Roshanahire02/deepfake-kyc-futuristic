# 🔐 Deepfake-Resistant Video KYC Verification System Using AI


## 📌 Overview

An AI-powered **Video KYC verification system** designed to detect identity fraud, deepfake impersonation, document manipulation, replay attacks, and presentation attacks during remote identity verification.

The system combines **Document OCR, Document Authenticity Analysis, Face Verification, Liveness Detection, rPPG Analysis, Replay Attack Detection, Deepfake Analysis, and Fraud Risk Assessment** into a single KYC verification workflow.

---

## 🎯 Problem Statement

Traditional remote KYC systems can be vulnerable to:

- Fake or manipulated identity documents
- Face impersonation
- Deepfake videos
- Replay attacks
- Presentation attacks
- Poor-quality verification signals
- Lack of explainable fraud assessment

This project provides a multi-layer AI-assisted approach to improve the reliability of remote Video KYC.

---

## 💡 Proposed Solution

The system verifies a user's identity through multiple independent verification layers:

```text
User
 │
 ▼
Create KYC Case
 │
 ▼
Identity Document
 │
 ├── OCR
 ├── Authenticity Check
 └── Tampering Analysis
 │
 ▼
Video KYC
 │
 ├── Face Detection
 ├── Face-Document Matching
 ├── Liveness Detection
 ├── rPPG Analysis
 ├── Replay Detection
 └── Deepfake Analysis
 │
 ▼
Fraud Risk Assessment
 │
 ▼
Verification Report
 │
 ▼
Reviewer Decision
🚀 Main Features
📄 1. Document Verification
Upload identity documents
OCR-based text extraction
Document authenticity analysis
Tampering detection
Document quality assessment
👤 2. Face Verification
Face detection
Face quality analysis
Face embedding generation
Face-document similarity matching
Identity consistency checking
👁️ 3. Liveness Detection

Challenge-based liveness verification using:

Blink twice
Turn head left
Turn head right

This helps detect basic presentation attacks.

❤️ 4. rPPG Analysis

Uses facial video frames to attempt extraction of a remote physiological signal.

The project uses a CHROM-based rPPG approach.

The result is treated as a supplementary verification signal, not a medical measurement.

🔄 5. Replay Attack Detection

Analyzes video characteristics to identify possible replay attacks using:

Temporal consistency
Frequency-domain analysis
Moiré patterns
Loop/periodicity indicators
🤖 6. Deepfake Analysis

Uses an EfficientNet-B0 based video-frame analysis pipeline to identify potential deepfake indicators.

⚠️ The current classification head requires proper training and validation on a suitable deepfake dataset. Therefore, this module is currently experimental and should not be considered a production-grade deepfake detector.

📊 7. Fraud Risk Assessment

Combines verification features into an overall fraud-risk assessment.

The current risk engine uses XGBoost and is trained on synthetic data for the academic prototype.

📑 8. Explainable Verification Report

Generates a report containing:

Document verification
OCR results
Face verification
Liveness results
rPPG results
Replay analysis
Deepfake analysis
Risk assessment
Verification status
👨‍⚖️ 9. Reviewer Workflow

Authorized reviewers can:

View KYC cases
Inspect verification results
Review risk information
Make verification decisions
Record reviewer actions
🧠 AI / ML Technologies
Module	Technology
OCR	EasyOCR
Face Detection	MediaPipe
Face Recognition	InsightFace / ArcFace
Liveness	MediaPipe + Computer Vision
rPPG	CHROM
Replay Detection	OpenCV + Frequency/Temporal Analysis
Deepfake Analysis	EfficientNet-B0
Risk Assessment	XGBoost
Explainability	SHAP
Computer Vision	OpenCV
ML Framework	PyTorch
Model Runtime	ONNX Runtime
🛠️ Technology Stack
Frontend
React
Vite
JavaScript
React Router
Axios
HTML/CSS
Backend
Python
FastAPI
Uvicorn
SQLAlchemy
Database
SQLite
AI / Computer Vision
OpenCV
MediaPipe
InsightFace
ArcFace
EasyOCR
PyTorch
ONNX Runtime
scikit-learn
XGBoost
SHAP
🏗️ Architecture
                    ┌────────────────────┐
                    │     React UI       │
                    │   Video KYC App    │
                    └─────────┬──────────┘
                              │
                              ▼
                    ┌────────────────────┐
                    │      FastAPI       │
                    │      Backend       │
                    └─────────┬──────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
   Document Analysis    Video Analysis        SQLite
          │                   │
          │          ┌────────┼─────────┐
          │          │        │         │
          ▼          ▼        ▼         ▼
         OCR       Face    Liveness   Replay
      Tampering    Match               rPPG
                                      Deepfake
                                          │
                                          ▼
                                  Risk Assessment
                                          │
                                          ▼
                                Verification Report
🔄 Complete KYC Workflow
User registration/login
Create KYC verification case
Upload identity document
Extract information using OCR
Analyze document authenticity
Analyze document tampering
Start Video KYC
Capture/process facial video
Detect face
Compare face with document
Perform liveness verification
Perform replay attack analysis
Perform rPPG analysis
Perform deepfake analysis
Calculate fraud risk
Generate verification report
Reviewer reviews the case
Reviewer makes final decision
🗄️ Database

The project currently uses SQLite for local development.

Main database tables include:

users
kyc_cases
documents
ocr_results
face_verification
liveness_results
rppg_results
replay_results
deepfake_results
risk_assessments
verification_reports
reviewer_actions

The local database and personal KYC files are excluded from GitHub.

🔌 Main API Endpoints
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me

POST /api/kyc/create
GET  /api/kyc/list
GET  /api/kyc/{case_id}

POST /api/kyc/document/upload
POST /api/kyc/document/analyze

POST /api/kyc/video/process

POST /api/kyc/risk/calculate

GET  /api/kyc/{case_id}/report

GET  /api/reviewer/cases
GET  /api/system/health
GET  /api/system/models
🔐 Security

The project includes:

Token-based authentication
Password hashing
Role-based access
Temporary video processing
Database-backed KYC records
Protected API endpoints
Separation of user/reviewer/admin functionality

Sensitive information such as:

.env files
Passwords
API keys
SQLite database
Identity documents
KYC videos

should not be committed to the public repository.

📈 Current Project Status
Working Components
User authentication
KYC case creation
Document upload
OCR
Document analysis
Face detection
Face-document matching
Liveness analysis
Replay analysis
rPPG analysis
Risk assessment
Database storage
Verification reports
Reviewer workflow
Experimental Components

Deepfake Detection

The EfficientNet-B0 pipeline is currently integrated, but its classification head requires proper training and validation on a deepfake dataset.

rPPG

rPPG is implemented as a supplementary signal and may return INSUFFICIENT SIGNAL depending on video quality and available frames.

⚠️ Limitations

This is an academic/prototype project, not a production KYC platform.

Important limitations include:

Deepfake classifier requires proper training
Risk model uses synthetic training data
rPPG can fail with insufficient signal
Results depend on camera and lighting conditions
Real-world regulatory compliance has not been implemented
Production security testing is still required
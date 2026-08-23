# Eduvo

> **Learning That Evolves With You**

Eduvo is an AI-powered, emotion-aware adaptive learning platform. It combines a modern learning-management experience with real-time emotion recognition, attention and fatigue indicators, engagement scoring, adaptive interventions, learning analytics, and role-based dashboards.

The platform was developed as a BSc Software Engineering final-year project. Its emotion-recognition service uses an EfficientNetB3 model trained with the RAF-DB dataset.

## Contents

- [Key features](#key-features)
- [Architecture](#architecture)
- [Technology stack](#technology-stack)
- [Privacy](#privacy)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [AI model](#ai-model)
- [Running the application](#running-the-application)
- [Testing](#testing)
- [Main API endpoints](#main-api-endpoints)
- [Project structure](#project-structure)
- [Troubleshooting](#troubleshooting)

## Key features

### Students

- Browse enrolled courses and multimedia learning materials.
- Learn through a smart session player using uploaded videos, YouTube content, documents, and external resources.
- Grant or revoke consent for webcam-based analysis.
- Receive real-time emotion, attention, fatigue, and engagement feedback.
- Receive adaptive nudges, alerts, support prompts, pauses, and break recommendations.
- Track course progress and review session reports, recommendations, achievements, and notifications.

### Teachers

- Create, edit, archive, and restore courses.
- Upload lesson videos and documents or attach YouTube and external-resource links.
- Arrange study materials in curriculum order.
- Enrol and remove students.
- Configure engagement thresholds and alert frequency.
- Review engagement, student analytics, emotional trends, at-risk learners, and reports.

### Administrators

- Manage users and role-based access.
- Monitor platform and AI-service health.
- Review system-wide analytics and privacy information.
- Manage notifications, settings, datasets, and research information.

## Architecture

```text
Student / Teacher / Administrator
                |
                v
       Next.js frontend :3000
                |
          REST/JSON API
                |
                v
      Express.js backend :3001
          |             |
          |             +------> MongoDB / MongoDB Atlas
          |
          +--------------------> Flask AI service :5000
                                   |
                                   +-- EfficientNetB3
                                   +-- OpenCV
                                   +-- MediaPipe
                                   +-- RAF-DB classes
```

The Express application is the central API gateway. The frontend does not access MongoDB or the Flask service directly during normal application workflows.

## Technology stack

| Layer | Technologies |
|---|---|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS, React Query, Axios, Recharts, Chart.js |
| Backend | Node.js, Express.js, Mongoose, JWT, bcrypt, Helmet, Multer |
| AI service | Python, Flask, TensorFlow/Keras, EfficientNetB3, OpenCV, MediaPipe, NumPy |
| Database | MongoDB Atlas or local MongoDB |
| Dataset | RAF-DB, seven basic facial-expression classes |

## Privacy

- Webcam access requires explicit learner permission and platform consent.
- Frames are processed temporarily for analysis.
- Raw webcam video, images, and audio are not retained as learning analytics.
- Only processed metadata, such as emotion labels, confidence, attention, engagement scores, interventions, and session statistics, is stored.
- Runtime course uploads are stored separately from the source repository.

## Prerequisites

- Node.js 20 or later
- npm
- Python 3.11 or 3.12
- MongoDB Atlas account or local MongoDB server
- A webcam for live learning-session analysis
- Git

## Installation

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
cd emotion-aware-learning-platform-complete
```

Install the JavaScript dependencies:

```bash
cd frontend
npm install
cd ../backend
npm install
cd ..
```

Create the Python environment on Windows PowerShell:

```powershell
cd ai-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
cd ..
```

If PowerShell prevents activation, run this in the current terminal:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

## Configuration

Copy the example configuration files:

```powershell
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env
Copy-Item ai-service\.env.example ai-service\.env
```

### Backend environment

Important values in `backend/.env`:

```dotenv
MONGODB_URI=mongodb://localhost:27017/emolearn
PORT=3001
NODE_ENV=development
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
AI_GATEWAY_URL=http://localhost:5000
AI_TIMEOUT_MS=15000
```

The AI study assistant is optional. Keep provider keys in `backend/.env`; never expose them through a `NEXT_PUBLIC_` variable.

### Frontend environment

`frontend/.env`:

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
NEXT_PUBLIC_AI_GATEWAY_URL=http://localhost:5000
NEXT_PUBLIC_APP_NAME=Eduvo
NEXT_PUBLIC_FRAME_RATE=10
NEXT_PUBLIC_WINDOW_SECONDS=30
NEXT_PUBLIC_CONFIDENCE_THRESHOLD=0.55
```

### AI-service environment

`ai-service/.env`:

```dotenv
FLASK_ENV=development
FLASK_PORT=5000
CONFIDENCE_THRESHOLD=0.55
CORS_ORIGINS=http://localhost:3000
```

Do not commit `.env` files. They are excluded by `.gitignore`.

## AI model

Place the trained model at:

```text
ai-service/model/final_emotion_model.keras
```

The model expects `300 x 300` input and recognises seven RAF-DB expression categories. Model files and datasets are excluded from Git because they are large. Distribute the trained model through approved private storage, a versioned release, or Git LFS.

Check the service and model through:

```http
GET http://localhost:5000/health
GET http://localhost:5000/model/info
```

## Running the application

Open three terminals.

### 1. Flask AI service

```powershell
cd ai-service
.\.venv\Scripts\Activate.ps1
python app.py
```

Expected address: `http://localhost:5000`

### 2. Express backend

```powershell
cd backend
npm run dev
```

Expected address: `http://localhost:3001`

### 3. Next.js frontend

```powershell
cd frontend
npm run dev
```

Open `http://localhost:3000`.

## Testing

Automated backend tests:

```bash
cd backend
npm test
```

Frontend production build:

```bash
cd frontend
npm run build
```

Postman can be used to test authentication, role protection, course management, uploads, Flask health, frame analysis, engagement-window storage, session completion, and report generation.

Never include passwords, JWTs, API keys, database connection strings, or full base64 webcam data in shared test screenshots.

## Main API endpoints

Protected Express endpoints require `Authorization: Bearer <JWT>`.

| Area | Method | Endpoint |
|---|---:|---|
| Authentication | POST | `/api/auth/register` |
| Authentication | POST | `/api/auth/login` |
| Current user | GET | `/api/auth/me` |
| Consent | PUT | `/api/auth/consent` |
| Courses | GET | `/api/courses/my` |
| Courses | POST | `/api/courses` |
| Courses | PUT | `/api/courses/:id` |
| Video upload | POST | `/api/courses/upload-video` |
| Material upload | POST | `/api/courses/upload-material` |
| Session | POST | `/api/sessions/start` |
| Engagement window | POST | `/api/sessions/:id/window` |
| Progress | PUT | `/api/sessions/:id/progress` |
| Session completion | POST | `/api/sessions/:id/end` |
| Session report | GET | `/api/sessions/:id/report` |
| AI health through Express | GET | `/api/ai/health` |
| Frame analysis | POST | `/api/ai/analyze-frame` |
| Engagement calculation | POST | `/api/ai/calculate-engagement` |
| Flask health | GET | `/health` |
| Flask prediction | POST | `/predict` |
| Flask batch prediction | POST | `/batch_predict` |

## Project structure

```text
emotion-aware-learning-platform-complete/
|-- frontend/              Next.js web application
|   |-- public/            Static assets
|   `-- src/               Pages, components, hooks, and API clients
|-- backend/               Express API gateway and business logic
|   |-- middleware/        Authentication and role checks
|   |-- models/            Mongoose schemas
|   |-- routes/            REST API routes
|   |-- test/              Automated backend tests
|   |-- uploads/           Runtime learning materials (ignored)
|   `-- utils/             Engagement, progress, and content utilities
|-- ai-service/            Flask inference service
|   |-- model/             Local trained model (ignored)
|   |-- utils/             Preprocessing, prediction, and face analysis
|   `-- requirements.txt   Python dependencies
|-- docs/                  Project documentation
|-- .gitignore
`-- README.md
```

## Troubleshooting

### `No token provided`

Log in first and send the returned JWT as a Bearer token on protected requests.

### `AI service unavailable`

Confirm that Flask is running on port `5000`, the model exists at the expected path, and `AI_GATEWAY_URL` is `http://localhost:5000`.

### NumPy or OpenCV import error

Use the pinned dependencies in `requirements.txt`. OpenCV and MediaPipe in this project require NumPy `1.26.4`:

```powershell
pip uninstall numpy -y
pip install numpy==1.26.4
pip install -r requirements.txt
```

### MongoDB connection error

Check `MONGODB_URI`, Atlas network access, database credentials, and whether the local MongoDB service is running.

### Uploaded video does not appear

Complete all three actions in the teacher course editor: upload the file, select **Add to course**, and save the course.

## Academic and ethical use

Eduvo is an academic prototype. Emotion and engagement predictions are probabilistic indicators and must not be treated as definitive measures of a learner's mental state, ability, or academic performance. Users should be informed about processing, retain control over consent, and be given access to learning without webcam analysis where appropriate.

## Author

Developed as a BSc Software Engineering final-year project.

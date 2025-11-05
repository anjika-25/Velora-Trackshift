 Velora: Realistic Racing Simulator — MVP

 Overview
 - Backend: FastAPI + Socket.IO, asyncio-ready
 - Frontend: React + D3 + Chart.js, Socket.IO client
 - Database: PostgreSQL (docker) or SQLite fallback (local)

 Quick Start (Docker)
 1) docker-compose up
 2) Open http://localhost:5173

 Local Backend (Windows)
 - cd backend
 - pip install -r requirements.txt
 - python app/main.py --laps 5 --track ./config/track_def.json --seed 1234

 Google Colab Demo
 - %cd velora/backend
 - !pip install -r requirements.txt
 - !python app/main.py --laps 5 --track ../config/track_def.json --demo

 Notes
 - Physics engine, RK4 integration, collision logic, event loop, and telemetry streaming are implemented in subsequent edits. This MVP scaffold runs the API and UI.
 - Weather API integration returns deterministic fallback when no key is provided.




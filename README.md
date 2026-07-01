# Trackom SaaS Platform

Enterprise Bulk SMS, USSD & Communications API — Kenya's leading B2B messaging platform.

## Architecture

- **Frontend**: React 19 + Vite + TailwindCSS v4 + Framer Motion
- **Backend**: Python FastAPI + SQLAlchemy (async) + PostgreSQL
- **PWA**: Installable progressive web app

## Quick Start

### 1. Start PostgreSQL
```bash
docker compose up -d
```

### 2. Start Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # Edit as needed
uvicorn app.main:app --reload --port 8000
```

### 3. Start Frontend
```bash
cd frontend
npm install
cp .env.example .env  # Edit as needed
npm run dev
```

### Access
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api
- **API Docs**: http://localhost:8000/api/docs
- **Database**: postgresql://trackom:trackom_secret@localhost:5432/trackom_db

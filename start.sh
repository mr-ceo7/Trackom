#!/bin/bash

# Exit immediately if any command fails
set -e

# Make sure we are in the script's directory
cd "$(dirname "$0")"

echo "========================================="
echo "   Starting Trackom B2B SaaS Platform   "
echo "========================================="

# 0. Clean up existing processes running on port 3000 and 8000
echo "Checking for running instances on port 3000 and 8000..."
if lsof -i :3000 -t >/dev/null ; then
    echo "Stopping existing process on port 3000..."
    fuser -k 3000/tcp || true
fi

if lsof -i :8000 -t >/dev/null ; then
    echo "Stopping existing process on port 8000..."
    fuser -k 8000/tcp || true
fi

# 1. Start Database Container
echo "Starting PostgreSQL database..."
docker compose up -d

# 2. Wait for Database & Run Migrations
echo "Waiting for PostgreSQL database to be ready..."
cd backend
source venv/bin/activate

DB_URL=$(grep -E "^DATABASE_URL=" .env | cut -d'=' -f2- | tr -d '"' | tr -d "'")
if [ -z "$DB_URL" ]; then
    DB_URL="postgresql+asyncpg://postgres:postgres@localhost:5432/trackom"
fi
TEST_URL=$(echo $DB_URL | sed 's/postgresql+asyncpg/postgresql/')

python3 -c "
import asyncio, asyncpg, sys
async def check():
    for i in range(45):
        try:
            conn = await asyncpg.connect('$TEST_URL', timeout=2)
            await conn.close()
            print('Database is online!')
            sys.exit(0)
        except Exception as e:
            print(f'Database not ready yet, retrying in 1s ({i+1}/45)...')
            await asyncio.sleep(1)
    print('Error: Database connection timed out after 45s.')
    sys.exit(1)
asyncio.run(check())
"

echo "Applying migrations..."
alembic upgrade head
cd ..

# 3. Setup cleanup on Ctrl+C (SIGINT/SIGTERM)
cleanup() {
    echo ""
    echo "========================================="
    echo "       Stopping Trackom Servers...       "
    echo "========================================="
    kill "$BACKEND_PID" 2>/dev/null || true
    kill "$FRONTEND_PID" 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM

# 4. Start Backend in the background (outputting logs to terminal)
echo "Starting backend server (port 8000)..."
cd backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
cd ..

# 5. Start Frontend in the background (silent to keep terminal clean)
echo "Starting frontend server (port 3000)..."
cd frontend
npm run dev > /dev/null 2>&1 &
FRONTEND_PID=$!
cd ..

echo "-----------------------------------------"
echo "🚀 Trackom is fully running!"
echo "👉 Frontend: http://localhost:3000"
echo "👉 Backend:  http://localhost:8000"
echo "-----------------------------------------"
echo "Backend Logs:"
echo "-----------------------------------------"

# Wait for background processes to keep script alive
wait

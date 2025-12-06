
set +e


RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BACKEND_DIR="backend"
FRONTEND_DIR="frontend"
BACKEND_PORT=8000
FRONTEND_PORT=3000
BACKEND_URL="http://localhost:${BACKEND_PORT}"
FRONTEND_URL="http://localhost:${FRONTEND_PORT}"
HEALTH_CHECK_URL="${BACKEND_URL}/api/health"

BACKEND_PID_FILE="/tmp/teamup_backend.pid"
FRONTEND_PID_FILE="/tmp/teamup_frontend.pid"

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

cleanup() {
    echo "" 
    print_info "Shutting down services..."
    
    if [ -f "$BACKEND_PID_FILE" ]; then
        BACKEND_PID=$(cat "$BACKEND_PID_FILE")
        if ps -p "$BACKEND_PID" > /dev/null 2>&1; then
            print_info "Stopping backend (PID: $BACKEND_PID)..."
            kill "$BACKEND_PID" 2>/dev/null || true
            sleep 1
            if ps -p "$BACKEND_PID" > /dev/null 2>&1; then
                kill -9 "$BACKEND_PID" 2>/dev/null || true
            fi
        fi
        rm -f "$BACKEND_PID_FILE"
    fi
    
    if [ -f "$FRONTEND_PID_FILE" ]; then
        FRONTEND_PID=$(cat "$FRONTEND_PID_FILE")
        if ps -p "$FRONTEND_PID" > /dev/null 2>&1; then
            print_info "Stopping frontend (PID: $FRONTEND_PID)..."
            kill "$FRONTEND_PID" 2>/dev/null || true
            sleep 1
            if ps -p "$FRONTEND_PID" > /dev/null 2>&1; then
                kill -9 "$FRONTEND_PID" 2>/dev/null || true
            fi
        fi
        rm -f "$FRONTEND_PID_FILE"
    fi
    
    if command -v lsof &> /dev/null; then
        if lsof -ti:8000 > /dev/null 2>&1; then
            print_info "Cleaning up port 8000..."
            lsof -ti:8000 | xargs kill -9 2>/dev/null || true
        fi
        if lsof -ti:3000 > /dev/null 2>&1; then
            print_info "Cleaning up port 3000..."
            lsof -ti:3000 | xargs kill -9 2>/dev/null || true
        fi
    fi
    
    print_success "Services stopped successfully"
    exit 0
}

trap cleanup SIGINT SIGTERM

if ! command -v python3 &> /dev/null; then
    print_error "Python3 is not installed. Please install Python3 first."
    exit 1
fi

if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

if [ ! -d "$BACKEND_DIR" ]; then
    print_error "Backend directory '$BACKEND_DIR' not found!"
    exit 1
fi

if [ ! -d "$FRONTEND_DIR" ]; then
    print_error "Frontend directory '$FRONTEND_DIR' not found!"
    exit 1
fi

if [ -n "$CONDA_DEFAULT_ENV" ]; then
    print_info "Found active conda environment: $CONDA_DEFAULT_ENV"
elif [ -d "$BACKEND_DIR/mytrend" ]; then
    print_info "Found mytrend virtual environment, activating it..."
    source "$BACKEND_DIR/mytrend/bin/activate"
elif [ -d "$BACKEND_DIR/venv" ]; then
    print_info "Found virtual environment in backend, activating it..."
    source "$BACKEND_DIR/venv/bin/activate"
elif [ -d "mytrend" ]; then
    print_info "Found mytrend virtual environment in root, activating it..."
    source mytrend/bin/activate
elif [ -d "venv" ]; then
    print_info "Found virtual environment in root, activating it..."
    source venv/bin/activate
elif [ -d "env" ]; then
    print_info "Found env virtual environment in root, activating it..."
    source env/bin/activate
else
    print_warning "No virtual environment found. Using system Python."
    print_warning "It's recommended to use a virtual environment (conda, venv, mytrend, or env)."
fi

print_info "Checking backend dependencies..."
cd "$BACKEND_DIR"
if ! python3 -c "import fastapi, uvicorn, mysql.connector" &> /dev/null; then
    print_warning "Backend dependencies not found. Installing..."
    pip install -r requirements.txt
fi
cd ..

print_info "Checking frontend dependencies..."
cd "$FRONTEND_DIR"
if [ ! -d "node_modules" ]; then
    print_warning "Frontend dependencies not found. Installing..."
    npm install
fi
cd ..

print_info "Starting backend server on port $BACKEND_PORT..."
cd "$BACKEND_DIR"
python3 main.py > /tmp/teamup_backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > "$BACKEND_PID_FILE"
cd ..
print_success "Backend server started (PID: $BACKEND_PID)"

print_info "Waiting for backend to be ready..."
MAX_WAIT=30
WAIT_COUNT=0

if command -v curl &> /dev/null; then
    while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
        if curl -s "$HEALTH_CHECK_URL" > /dev/null 2>&1; then
            print_success "Backend is ready!"
            break
        fi
        WAIT_COUNT=$((WAIT_COUNT + 1))
        sleep 1
        echo -n "."
    done
    echo ""
    
    if [ $WAIT_COUNT -eq $MAX_WAIT ]; then
        print_warning "Backend may not be ready, but continuing anyway..."
        print_warning "Check backend logs: /tmp/teamup_backend.log"
        print_warning "You can verify backend is running at: $BACKEND_URL"
    fi
else
    print_warning "curl not found, waiting 5 seconds for backend to start..."
    sleep 5
fi

print_info "Starting frontend server on port $FRONTEND_PORT..."
cd "$FRONTEND_DIR"
npm run dev > /tmp/teamup_frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > "$FRONTEND_PID_FILE"
cd ..
print_success "Frontend server started (PID: $FRONTEND_PID)"

sleep 3

echo ""
print_success "=========================================="
print_success "TeamUp UIUC is now running!"
print_success "=========================================="
echo ""
print_info "Backend API:  $BACKEND_URL"
print_info "Frontend:     $FRONTEND_URL"
print_info "Health Check: $HEALTH_CHECK_URL"
echo ""

if command -v open &> /dev/null; then
    print_info "Opening browser..."
    sleep 2
    open "$FRONTEND_URL" 2>/dev/null || true
elif command -v xdg-open &> /dev/null; then
    print_info "Opening browser..."
    sleep 2
    xdg-open "$FRONTEND_URL" 2>/dev/null || true
fi

echo ""
print_info "View logs in real-time:"
print_info "  Backend:  tail -f /tmp/teamup_backend.log"
print_info "  Frontend: tail -f /tmp/teamup_frontend.log"
echo ""
print_warning "Press Ctrl+C to stop all services"
echo ""

while true; do
    sleep 5
    if [ -f "$BACKEND_PID_FILE" ]; then
        BACKEND_PID=$(cat "$BACKEND_PID_FILE")
        if ! ps -p "$BACKEND_PID" > /dev/null 2>&1; then
            print_error "Backend process died!"
            cleanup
            exit 1
        fi
    fi
    if [ -f "$FRONTEND_PID_FILE" ]; then
        FRONTEND_PID=$(cat "$FRONTEND_PID_FILE")
        if ! ps -p "$FRONTEND_PID" > /dev/null 2>&1; then
            print_error "Frontend process died!"
            cleanup
            exit 1
        fi
    fi
done


#!/bin/bash

# Stop Frontend Script
# Kills frontend Node.js processes

echo "🛑 Stopping frontend processes..."

# Frontend development ports
FRONTEND_PORTS=(3000 3001)

# Function to kill processes on a specific port
kill_processes_on_port() {
    local port=$1
    local pids=$(lsof -ti:$port 2>/dev/null)
    
    if [ -n "$pids" ]; then
        echo "📡 Stopping frontend processes on port $port..."
        echo "$pids" | xargs kill -9 2>/dev/null
        echo "✅ Stopped frontend processes on port $port"
    else
        echo "ℹ️  No frontend processes found on port $port"
    fi
}

# Kill processes on each frontend port
for port in "${FRONTEND_PORTS[@]}"; do
    kill_processes_on_port $port
done

# Also kill any remaining frontend Node.js processes
echo "🔍 Looking for any remaining frontend Node.js processes..."
FRONTEND_PIDS=$(pgrep -f "node.*(next|frontend)" 2>/dev/null)

if [ -n "$FRONTEND_PIDS" ]; then
    echo "📡 Stopping remaining frontend Node.js processes..."
    echo "$FRONTEND_PIDS" | xargs kill -9 2>/dev/null
    echo "✅ Stopped remaining frontend Node.js processes"
else
    echo "ℹ️  No additional frontend Node.js processes found"
fi

echo "🎉 Frontend processes stopped!" 
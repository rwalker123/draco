#!/bin/bash

# Stop Backend Script
# Kills backend Node.js processes

echo "🛑 Stopping backend processes..."

# Backend development ports
BACKEND_PORTS=(3000 3001)

# Function to kill processes on a specific port
kill_processes_on_port() {
    local port=$1
    local pids=$(lsof -ti:$port 2>/dev/null)
    
    if [ -n "$pids" ]; then
        echo "📡 Stopping backend processes on port $port..."
        echo "$pids" | xargs kill -9 2>/dev/null
        echo "✅ Stopped backend processes on port $port"
    else
        echo "ℹ️  No backend processes found on port $port"
    fi
}

# Kill processes on each backend port
for port in "${BACKEND_PORTS[@]}"; do
    kill_processes_on_port $port
done

# Also kill any remaining backend Node.js processes
echo "🔍 Looking for any remaining backend Node.js processes..."
BACKEND_PIDS=$(pgrep -f "node.*(server|backend)" 2>/dev/null)

if [ -n "$BACKEND_PIDS" ]; then
    echo "📡 Stopping remaining backend Node.js processes..."
    echo "$BACKEND_PIDS" | xargs kill -9 2>/dev/null
    echo "✅ Stopped remaining backend Node.js processes"
else
    echo "ℹ️  No additional backend Node.js processes found"
fi

echo "🎉 Backend processes stopped!" 
#!/bin/bash

# Stop Processes Script
# Kills Node.js processes running on common development ports

echo "🛑 Stopping all development processes..."

# Common development ports
PORTS=(3000 3001)

# Function to kill processes on a specific port
kill_processes_on_port() {
    local port=$1
    local pids=$(lsof -ti:$port 2>/dev/null)
    
    if [ -n "$pids" ]; then
        echo "📡 Stopping processes on port $port..."
        echo "$pids" | xargs kill -9 2>/dev/null
        echo "✅ Stopped processes on port $port"
    else
        echo "ℹ️  No processes found on port $port"
    fi
}

# Kill processes on each port
for port in "${PORTS[@]}"; do
    kill_processes_on_port $port
done

# Also kill any remaining Node.js processes that might be running
echo "🔍 Looking for any remaining Node.js processes..."
NODE_PIDS=$(pgrep -f "node.*(dev|start)" 2>/dev/null)

if [ -n "$NODE_PIDS" ]; then
    echo "📡 Stopping remaining Node.js processes..."
    echo "$NODE_PIDS" | xargs kill -9 2>/dev/null
    echo "✅ Stopped remaining Node.js processes"
else
    echo "ℹ️  No additional Node.js processes found"
fi

echo "🎉 All development processes stopped!" 
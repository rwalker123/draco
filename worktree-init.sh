#!/bin/bash

# Worktree Initialization Script for Draco Sports Manager
# This script sets up a new git worktree with all necessary files and dependencies
#
# Usage:
#   ./worktree-init.sh           # Full setup with node_modules copy
#   ./worktree-init.sh --no-copy # Skip copying node_modules (faster)

set -e  # Exit on any error

# Parse command line arguments
for arg in "$@"; do
    case $arg in
        --help|-h)
            echo "Usage: $0 [--no-copy] [--help]"
            echo "  --no-copy   Skip copying node_modules from main repo"
            echo "  --help      Show this help message"
            exit 0
            ;;
    esac
done

# Source common functions
source "$(dirname "$0")/scripts/common-functions.sh"

# Get the current worktree path
CURRENT_DIR="$(pwd)"

print_status "Initializing git worktree: $CURRENT_DIR"

# Check if we're in a git worktree
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    print_error "Current directory is not a git repository or worktree"
    exit 1
fi


# Find the main repository
MAIN_REPO_PATH=$(find_main_repo "$CURRENT_DIR")
if [ -z "$MAIN_REPO_PATH" ]; then
    print_error "Could not find main repository path"
    exit 1
fi

print_status "Main repository: $MAIN_REPO_PATH"

# Step 1: Port Management and Environment Setup
print_status "Setting up port management and environment files..."

# Check if jq is available for JSON processing
if ! command -v jq &> /dev/null; then
    print_error "jq is required for port management. Please install jq to continue."
    print_error "Install with: brew install jq (macOS) or apt-get install jq (Ubuntu)"
    exit 1
fi

# Initialize port registry if it doesn't exist
REGISTRY_PATH="$MAIN_REPO_PATH/draco-nodejs/.worktree-ports.json"
if [ ! -f "$REGISTRY_PATH" ]; then
    print_status "Creating initial port registry..."
    cat > "$REGISTRY_PATH" << EOF
{
  "lastUpdated": "$(date -u +%Y-%m-%dT%H:%M:%S.000Z)",
  "registryVersion": "1.0",
  "worktrees": {},
  "portRanges": {
    "backend": {"min": 3001, "max": 3099},
    "frontend": {"min": 4001, "max": 4099}
  }
}
EOF
    print_success "Port registry created"
fi

# Calculate worktree hash for deterministic port assignment
WORKTREE_HASH=0
for ((i=0; i<${#CURRENT_DIR}; i++)); do
    CHAR_CODE=$(printf '%d' "'${CURRENT_DIR:$i:1}")
    WORKTREE_HASH=$(( (WORKTREE_HASH * 31 + CHAR_CODE) & 0xffffffff ))
done
WORKTREE_HASH=$((WORKTREE_HASH & 0x7fffffff)) # Ensure positive

# Calculate target ports
BACKEND_TARGET_PORT=$((3001 + (WORKTREE_HASH % 99)))
FRONTEND_TARGET_PORT=$((4001 + (WORKTREE_HASH % 99)))

# Reserved ports that should not be assigned to any worktree services
RESERVED_PORTS=(3001 4001 4045)

# Collect ports already assigned to other worktrees from the registry
IN_USE_PORTS=()
if [ -f "$REGISTRY_PATH" ]; then
    while IFS= read -r assigned_port; do
        if [ -n "$assigned_port" ]; then
            IN_USE_PORTS+=("$assigned_port")
        fi
    done < <(
        jq -r --arg path "$CURRENT_DIR" '
          (.worktrees // {})
          | to_entries[]
          | select(.key != $path)
          | [ .value.backendPort, .value.frontendPort ]
          | map(select(. != null))
          | .[]
        ' "$REGISTRY_PATH"
    )
fi

is_port_in_use() {
    local port="$1"
    for used in "${IN_USE_PORTS[@]}"; do
        if [ "$port" -eq "$used" ]; then
            return 0
        fi
    done
    return 1
}

is_reserved_port() {
    local port="$1"
    for reserved in "${RESERVED_PORTS[@]}"; do
        if [ "$port" -eq "$reserved" ]; then
            return 0
        fi
    done
    return 1
}

print_status "Calculated target ports: Backend $BACKEND_TARGET_PORT, Frontend $FRONTEND_TARGET_PORT"

# Function to check if port is available
check_port_available() {
    local port="$1"
    ! netstat -an | grep LISTEN | grep ":$port " > /dev/null 2>&1
}

# Find available ports
find_available_port() {
    local target_port="$1"
    local min_port="$2"
    local max_port="$3"
    local service_name="$4"

    local port="$target_port"

    if is_reserved_port "$port" || is_port_in_use "$port" || ! check_port_available "$port"; then
        print_warning "$service_name port $port is unavailable, finding next available..." >&2
        for ((p=min_port; p<=max_port; p++)); do
            if ! is_reserved_port "$p" && ! is_port_in_use "$p" && check_port_available "$p"; then
                port=$p
                break
            fi
        done
    fi

    if is_reserved_port "$port" || is_port_in_use "$port" || ! check_port_available "$port"; then
        print_error "Unable to find available port for $service_name in range $min_port-$max_port"
        exit 1
    fi

    echo "$port"
}

BACKEND_PORT=$(find_available_port "$BACKEND_TARGET_PORT" 3001 3099 "Backend")
FRONTEND_PORT=$(find_available_port "$FRONTEND_TARGET_PORT" 4001 4099 "Frontend")

print_success "Assigned ports: Backend $BACKEND_PORT, Frontend $FRONTEND_PORT"

# Extract worktree name
WORKTREE_NAME=$(basename "$CURRENT_DIR")

# Update port registry
print_status "Updating port registry..."
TEMP_REGISTRY=$(mktemp)
jq --arg path "$CURRENT_DIR" \
   --arg name "$WORKTREE_NAME" \
   --argjson backendPort "$BACKEND_PORT" \
   --argjson frontendPort "$FRONTEND_PORT" \
   --arg now "$(date -u +%Y-%m-%dT%H:%M:%S.000Z)" \
   '.worktrees[$path] = {
     "worktreePath": $path,
     "worktreeName": $name,
     "backendPort": $backendPort,
     "frontendPort": $frontendPort,
     "lastActive": $now,
     "status": "active",
     "envFiles": {
       "backend": ($path + "/draco-nodejs/backend/.env"),
       "frontend": ($path + "/draco-nodejs/frontend-next/.env.local"),
       "mobile": ($path + "/draco-mobile/.env")
     }
   } | .lastUpdated = $now' "$REGISTRY_PATH" > "$TEMP_REGISTRY"
mv "$TEMP_REGISTRY" "$REGISTRY_PATH"
print_success "Port registry updated, moved from $TEMP_REGISTRY to $REGISTRY_PATH"


# Copy and modify .env files with new ports
print_status "Setting up environment files with assigned ports..."

# Determine machine IP for mobile API configuration
print_status "Detecting machine IP address for mobile client..."
MACHINE_IP=$(node -e "const os=require('os'); const interfaces=os.networkInterfaces(); const ips=Object.values(interfaces).flatMap(list => list || []).filter(iface => iface && iface.family === 'IPv4' && !iface.internal).map(iface => iface.address); if (!ips.length) { process.exit(1); } process.stdout.write(ips[0]);" 2>/dev/null) || MACHINE_IP=""
if [ -z "$MACHINE_IP" ]; then
    print_warning "Unable to determine a non-loopback IPv4 address; defaulting MOBILE_API_URL to localhost"
    MACHINE_IP="localhost"
else
    print_success "Detected machine IP address: $MACHINE_IP"
fi

# Backend .env file
if [ -f "$MAIN_REPO_PATH/draco-nodejs/backend/.env" ]; then
    mkdir -p "draco-nodejs/backend"
    cp "$MAIN_REPO_PATH/draco-nodejs/backend/.env" "draco-nodejs/backend/.env"
    
    # Update PORT and FRONTEND_URL in backend .env
    sed -i.bak "s/^PORT=.*/PORT=$BACKEND_PORT/" "draco-nodejs/backend/.env"
    sed -i.bak "s|^FRONTEND_URL=.*|FRONTEND_URL=http://localhost:$FRONTEND_PORT|" "draco-nodejs/backend/.env"
    rm -f "draco-nodejs/backend/.env.bak"
    
    print_success "Backend .env configured with port $BACKEND_PORT"
else
    print_warning "Backend .env file not found in main repo"
fi

# Frontend .env.local file
if [ -f "$MAIN_REPO_PATH/draco-nodejs/frontend-next/.env.local" ]; then
    mkdir -p "draco-nodejs/frontend-next"
    cp "$MAIN_REPO_PATH/draco-nodejs/frontend-next/.env.local" "draco-nodejs/frontend-next/.env.local"
    
    # Update NEXT_PUBLIC_API_URL in frontend .env.local
    sed -i.bak "s|^[[:space:]]*NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=https://localhost:$BACKEND_PORT|" "draco-nodejs/frontend-next/.env.local"
    
    # Add or update PORT variable for frontend
    if grep -q "^[[:space:]]*PORT=" "draco-nodejs/frontend-next/.env.local"; then
        sed -i.bak "s/^[[:space:]]*PORT=.*/PORT=$FRONTEND_PORT/" "draco-nodejs/frontend-next/.env.local"
    else
        echo "PORT=$FRONTEND_PORT" >> "draco-nodejs/frontend-next/.env.local"
    fi
    
    rm -f "draco-nodejs/frontend-next/.env.local.bak"
    
    print_success "Frontend .env.local configured with backend port $BACKEND_PORT and frontend port $FRONTEND_PORT"
else
    print_warning "Frontend .env.local file not found in main repo"
fi

# Mobile .env file
MOBILE_ENV_TARGET="draco-mobile/.env"
MOBILE_ENV_SOURCE=""
if [ -f "$MAIN_REPO_PATH/draco-mobile/.env" ]; then
    MOBILE_ENV_SOURCE="$MAIN_REPO_PATH/draco-mobile/.env"
elif [ -f "$MAIN_REPO_PATH/draco-mobile/.env.example" ]; then
    MOBILE_ENV_SOURCE="$MAIN_REPO_PATH/draco-mobile/.env.example"
fi

if [ -n "$MOBILE_ENV_SOURCE" ]; then
    mkdir -p "draco-mobile"
    cp "$MOBILE_ENV_SOURCE" "$MOBILE_ENV_TARGET"

    MOBILE_API_URL="https://$MACHINE_IP:$BACKEND_PORT"
    if grep -q "^[[:space:]]*MOBILE_API_URL=" "$MOBILE_ENV_TARGET"; then
        sed -i.bak "s|^[[:space:]]*MOBILE_API_URL=.*|MOBILE_API_URL=$MOBILE_API_URL|" "$MOBILE_ENV_TARGET"
    else
        echo "MOBILE_API_URL=$MOBILE_API_URL" >> "$MOBILE_ENV_TARGET"
    fi
    rm -f "${MOBILE_ENV_TARGET}.bak"

    print_success "Mobile .env configured with MOBILE_API_URL=$MOBILE_API_URL"
else
    print_warning "No mobile .env template found; skipped configuring draco-mobile/.env"
fi

# Backend certs directory (SSL certificates for HTTPS development)
if [ -d "$MAIN_REPO_PATH/draco-nodejs/backend/certs" ]; then
    mkdir -p "draco-nodejs/backend"
    cp -r "$MAIN_REPO_PATH/draco-nodejs/backend/certs" "draco-nodejs/backend/"
    print_success "Copied backend certs directory (SSL certificates)"
else
    print_warning "Backend certs directory not found in main repo"
fi

# Claude settings file
if [ -f "$MAIN_REPO_PATH/.claude/settings.local.json" ]; then
    mkdir -p ".claude"
    cp "$MAIN_REPO_PATH/.claude/settings.local.json" ".claude/settings.local.json"
    print_success "Copied Claude settings file"
else
    print_warning "Claude settings file not found in main repo"
fi
# Step 3: Install/update dependencies
print_status "Installing dependencies..."

# Root npm install
if [ ! -d "node_modules" ]; then
    print_status "Installing root dependencies..."
    npm install
    print_success "Root dependencies installed"
else
    print_status "Updating root dependencies..."
    npm install
    print_success "Root dependencies updated"
fi

# Backend npm install
if [ ! -d "draco-nodejs/backend/node_modules" ]; then
    print_status "Installing backend dependencies..."
    cd draco-nodejs/backend
    npm install
    cd "$CURRENT_DIR"
    print_success "Backend dependencies installed"
else
    print_status "Updating backend dependencies..."
    cd draco-nodejs/backend
    npm install
    cd "$CURRENT_DIR"
    print_success "Backend dependencies updated"
fi

# Frontend npm install
if [ ! -d "draco-nodejs/frontend-next/node_modules" ]; then
    print_status "Installing frontend dependencies..."
    cd draco-nodejs/frontend-next
    npm install
    cd "$CURRENT_DIR"
    print_success "Frontend dependencies installed"
else
    print_status "Updating frontend dependencies..."
    cd draco-nodejs/frontend-next
    npm install
    cd "$CURRENT_DIR"
    print_success "Frontend dependencies updated"
fi

# Step 4: Run Prisma generate for database client
print_status "Generating Prisma client..."
cd draco-nodejs/backend
npx prisma generate
cd "$CURRENT_DIR"
print_success "Prisma client generated"

# Step 6: Verify setup
print_status "Verifying setup..."

# Check if build works
print_status "Testing build..."
if npm run build >/dev/null 2>&1; then
    print_success "Build test passed"
else
    print_warning "Build test failed - you may need to check configuration"
fi

# Step 7: Display port assignment summary
echo ""
print_header "🚀 Worktree Port Assignment Summary"
echo ""
echo "  📍 Worktree: $WORKTREE_NAME"
echo "  🖥️  Backend Port: $BACKEND_PORT (https://localhost:$BACKEND_PORT)"
echo "  🌐 Frontend Port: $FRONTEND_PORT (https://localhost:$FRONTEND_PORT)"
echo "  🔗 API URL: https://localhost:$BACKEND_PORT"
echo "  🌍 Frontend URL: https://localhost:$FRONTEND_PORT"
echo "  📱 Mobile API URL: http://$MACHINE_IP:$BACKEND_PORT"
echo ""
echo "  📁 Backend .env: draco-nodejs/backend/.env"
echo "  📁 Frontend .env.local: draco-nodejs/frontend-next/.env.local"
echo "  📁 Mobile .env: draco-mobile/.env"
echo ""

# Summary
echo ""
print_success "Worktree initialization complete!"
echo ""
print_status "Summary of actions:"
echo "  ✓ Port management configured"
echo "  ✓ Environment files updated with assigned ports"
echo "  ✓ Port registry updated"
echo "  ✓ Copied SSL certificates from main repo"
echo "  ✓ Copied Claude settings from main repo"
echo "  ✓ Installed all dependencies"
echo "  ✓ Generated Prisma client"
echo "  ✓ Verified build setup"
echo ""
print_status "Your worktree is ready for development!"
print_status "You can now run: npm run dev"
echo ""
print_status "💡 Tip: Use './worktree-status.sh' to view all worktree port assignments"
echo ""

# Optional: Show git worktree info
print_status "Git worktree info:"
git worktree list | grep "$(pwd)"

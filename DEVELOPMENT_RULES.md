# Development Rules for Draco Node.js Migration

## 🚨 CRITICAL: Directory Navigation Rules

### Rule 1: ALWAYS Use Helper Scripts - NO EXCEPTIONS
**NEVER run npm commands directly. ALWAYS use:**
- `./run-backend.sh <command>` for backend commands
- `./run-frontend.sh <command>` for frontend commands

### Rule 2: STRICT ENFORCEMENT
**If you see ANY of these errors, you violated the rules:**
```
npm error code ENOENT
npm error syscall open
npm error path /Users/raywalker/source/Draco/package.json
npm error errno -2
npm error enoent Could not read package.json
```

**IMMEDIATE ACTION REQUIRED:**
1. STOP what you're doing
2. Use the helper script instead
3. Never run `npm start`, `npm run build`, etc. directly

### Rule 3: Helper Script Commands
**Backend commands:**
```bash
./run-backend.sh start    # Start the server
./run-backend.sh build    # Build the project
./run-backend.sh dev      # Development mode
./run-backend.sh test     # Run tests
```

**Frontend commands:**
```bash
./run-frontend.sh npm start    # Start React dev server
./run-frontend.sh npm build    # Build React app
./run-frontend.sh npm test     # Run React tests
```

### Rule 4: Directory Structure
- **Backend commands**: Must use `./run-backend.sh`
- **Frontend commands**: Must use `./run-frontend.sh`
- **Root commands**: Must be run from `/Users/raywalker/source/Draco`

### Rule 5: Verification Steps
**BEFORE running any command, ALWAYS:**
1. Check if you're in the root directory (`/Users/raywalker/source/Draco`)
2. Use the appropriate helper script
3. Never navigate to subdirectories manually

### Rule 6: Error Prevention
- If you see "ENOENT: no such file or directory, open '/Users/raywalker/source/Draco/package.json'"
- STOP immediately
- Use `./run-backend.sh` or `./run-frontend.sh` instead
- This error means you're trying to run npm from the wrong directory

## 📁 Directory Map
```
/Users/raywalker/source/Draco/
├── run-backend.sh        ← Use this for backend commands
├── run-frontend.sh       ← Use this for frontend commands
├── draco-nodejs/
│   ├── backend/          ← Backend npm commands via run-backend.sh
│   └── frontend/         ← Frontend npm commands via run-frontend.sh
└── [other files]         ← Root git commands
```

## 🔧 Helper Scripts
- `run-backend.sh` - Enforces backend directory navigation
- `run-frontend.sh` - Enforces frontend directory navigation

## ⚠️ Common Mistakes to Avoid
1. Running `npm start` from root directory ❌
2. Running `npm install` from wrong directory ❌
3. Using `cd` to navigate to backend/frontend ❌
4. Not using helper scripts ❌

## ✅ Success Checklist
- [ ] Using helper script (not direct npm commands)
- [ ] No "ENOENT" errors
- [ ] Command executed successfully
- [ ] Proper directory navigation enforced

## 🚫 FORBIDDEN COMMANDS
**NEVER run these directly:**
- `npm start`
- `npm run build`
- `npm install`
- `cd draco-nodejs/backend && npm start`
- `cd draco-nodejs/frontend && npm start`

**ALWAYS use these instead:**
- `./run-backend.sh start`
- `./run-backend.sh build`
- `./run-frontend.sh npm start`
- `./run-frontend.sh npm run build` 
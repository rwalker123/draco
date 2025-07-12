# Development Rules for Draco Node.js Migration

## 🚨 CRITICAL: Directory Navigation Rules

### Rule 1: ALWAYS Use Root-Level NPM Scripts - NO EXCEPTIONS
**NEVER run npm commands directly in subdirectories. ALWAYS use:**
- `npm run backend:build` for backend build
- `npm run backend:test` for backend tests
- `npm run backend:lint` for backend linting
- `npm run frontend-next:build` for frontend build
- `npm run frontend-next:test` for frontend tests
- `npm run frontend-next:lint` for frontend linting

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
2. Use the root-level npm script instead
3. Never run `npm start`, `npm run build`, etc. directly in subdirectories

### Rule 3: Script Commands
**Backend commands:**
```bash
npm run backend:start    # Start the backend server
npm run backend:build    # Build the backend project
npm run backend:test     # Run backend tests
npm run backend:lint     # Lint backend code
```

**Frontend commands:**
```bash
npm run frontend-next:start    # Start the frontend dev server
npm run frontend-next:build    # Build the frontend app
npm run frontend-next:test     # Run frontend tests
npm run frontend-next:lint     # Lint frontend code
```

### Rule 4: Directory Structure
- **All commands**: Must use root-level npm scripts
- **Never run npm commands in subdirectories**
- **Root commands**: Must be run from `/Users/raywalker/source/Draco`

### Rule 5: Verification Steps
**BEFORE running any command, ALWAYS:**
1. Check if you're in the root directory (`/Users/raywalker/source/Draco`)
2. Use the appropriate root-level npm script
3. Never navigate to subdirectories manually to run npm commands

### Rule 6: Error Prevention
- If you see "ENOENT: no such file or directory, open '/Users/raywalker/source/Draco/package.json'"
- STOP immediately
- Use the correct root-level npm script instead
- This error means you're trying to run npm from the wrong directory or in a subdirectory

### Rule 7: Always use RoleContext (useRole) in frontend checks to see if user has permissions

## 📁 Directory Map
```
/Users/raywalker/source/Draco/
├── package.json            ← Use this for all npm scripts
├── draco-nodejs/
│   ├── backend/            ← Backend code
│   └── frontend-next/      ← Frontend code
└── [other files]           ← Root git commands
```

## 🔧 Helper Scripts
- All helper scripts are now npm scripts in the root-level package.json

## ⚠️ Common Mistakes to Avoid
1. Running `npm start` from root directory ❌
2. Running `npm install` from wrong directory ❌
3. Using `cd` to navigate to backend/frontend to run npm commands ❌
4. Not using root-level npm scripts ❌

## ✅ Success Checklist
- [ ] Using root-level npm script (not direct npm commands in subdirs)
- [ ] No "ENOENT" errors
- [ ] Command executed successfully
- [ ] Proper directory navigation enforced

## 🚫 FORBIDDEN COMMANDS
**NEVER run these directly:**
- `npm start` (in any directory)
- `npm run build` (in any subdirectory)
- `npm install` (in any subdirectory)
- `cd draco-nodejs/backend && npm start`
- `cd draco-nodejs/frontend-next && npm start`

**ALWAYS use these instead:**
- `npm run backend:start`
- `npm run backend:build`
- `npm run backend:test`
- `npm run backend:lint`
- `npm run frontend-next:start`
- `npm run frontend-next:build`
- `npm run frontend-next:test`
- `npm run frontend-next:lint` 
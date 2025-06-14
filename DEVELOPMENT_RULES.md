# Development Rules for Draco Node.js Migration

## 🚨 CRITICAL: Directory Navigation Rules

### Rule 1: ALWAYS Check Directory Before Running Commands
**BEFORE running any npm command, ALWAYS:**
1. Check current directory with `pwd`
2. Verify you're in the correct directory for the task
3. Navigate to the correct directory if needed

### Rule 2: Directory Structure
- **Backend commands**: Must be run from `/Users/raywalker/source/Draco/draco-nodejs/backend`
- **Frontend commands**: Must be run from `/Users/raywalker/source/Draco/draco-nodejs/frontend`
- **Root commands**: Must be run from `/Users/raywalker/source/Draco`

### Rule 3: Use Directory-Specific Scripts
- Use `run-backend.sh` for backend commands
- Use `run-frontend.sh` for frontend commands
- These scripts enforce correct directory navigation

### Rule 4: Verification Steps
**ALWAYS run these commands before npm commands:**
```bash
# For backend
cd draco-nodejs/backend && pwd && npm <command>

# For frontend  
cd draco-nodejs/frontend && pwd && npm <command>
```

### Rule 5: Error Prevention
- If you see "ENOENT: no such file or directory, open '/Users/raywalker/source/Draco/package.json'" 
- STOP immediately
- Check current directory with `pwd`
- Navigate to correct directory before retrying

## 📁 Directory Map
```
/Users/raywalker/source/Draco/
├── draco-nodejs/
│   ├── backend/          ← Backend npm commands
│   └── frontend/         ← Frontend npm commands
└── [other files]         ← Root git commands
```

## 🔧 Helper Scripts
- `run-backend.sh` - Enforces backend directory navigation
- `run-frontend.sh` - Enforces frontend directory navigation

## ⚠️ Common Mistakes to Avoid
1. Running `npm start` from root directory
2. Running `npm install` from wrong directory
3. Forgetting to check `pwd` before commands
4. Not using the helper scripts

## ✅ Success Checklist
- [ ] Current directory verified with `pwd`
- [ ] Correct directory for the task
- [ ] Command executed successfully
- [ ] No "ENOENT" errors 
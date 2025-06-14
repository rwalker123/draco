# Development Rules

## Directory Navigation

### Rule: Always navigate to the correct directory before running npm commands

**Problem**: Running npm commands from the wrong directory causes errors like:
```
npm error code ENOENT
npm error syscall open
npm error path /Users/raywalker/source/Draco/package.json
npm error errno -2
npm error enoent Could not read package.json: Error: ENOENT: no such file or directory
```

**Solution**: Always change to the correct directory first:

```bash
# For backend
cd draco-nodejs/backend
npm start
npm run build
npm run dev

# For frontend (when created)
cd draco-nodejs/frontend
npm start
npm run build
```

**Current Project Structure**:
```
/Users/raywalker/source/Draco/
├── draco-nodejs/
│   ├── backend/          # Backend Node.js/Express app
│   │   ├── src/
│   │   ├── dist/
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── frontend/         # Frontend React app (to be created)
```

**Remember**: The terminal working directory must match the location of the package.json file you want to use. 
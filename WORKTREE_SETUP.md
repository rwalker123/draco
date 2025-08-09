# Git Worktree Setup for Draco Sports Manager

This document explains how to set up and use git worktrees for development on the Draco Sports Manager project.

## What is a Git Worktree?

A git worktree allows you to have multiple working directories for the same repository. This is useful for:
- Working on different features simultaneously
- Testing changes without affecting your main development branch
- Isolating experimental work

## Quick Setup

1. **Create a new worktree** (run from main repo `/Users/raywalker/source/Draco`):
   ```bash
   git worktree add ../draco-feature-name feature-branch-name
   ```

2. **Initialize the worktree** (run from the new worktree directory):
   ```bash
   ./worktree-init.sh
   ```

3. **Start development**:
   ```bash
   npm run dev
   ```

## What the initialization script does

The `worktree-init.sh` script automatically:

- **Copies environment files** from the main repo:
  - `draco-nodejs/backend/.env`
  - `draco-nodejs/frontend-next/.env.local`

- **Copies node_modules** (if they exist) to save installation time:
  - Root `node_modules`
  - Backend `node_modules`
  - Frontend `node_modules`

- **Installs dependencies** in all locations:
  - Root: `npm install`
  - Backend: `npm install`
  - Frontend: `npm install`

- **Generates Prisma client** for database access

- **Verifies the setup** by testing the build

## Manual Setup (if script fails)

If the script doesn't work, you can set up manually:

```bash
# 1. Copy environment files
mkdir -p draco-nodejs/backend
mkdir -p draco-nodejs/frontend-next
cp /Users/raywalker/source/Draco/draco-nodejs/backend/.env draco-nodejs/backend/
cp /Users/raywalker/source/Draco/draco-nodejs/frontend-next/.env.local draco-nodejs/frontend-next/

# 2. Install dependencies
npm install
cd draco-nodejs/backend && npm install && cd ../..
cd draco-nodejs/frontend-next && npm install && cd ../..

# 3. Generate Prisma client
cd draco-nodejs/backend && npx prisma generate && cd ../..

# 4. Test build
npm run build
```

## Working with Worktrees

### List all worktrees:
```bash
git worktree list
```

### Remove a worktree:
```bash
git worktree remove /path/to/worktree
# or from inside the worktree:
git worktree remove .
```

### Prune deleted worktrees:
```bash
git worktree prune
```

## Important Notes

- **Environment files are NOT tracked by git** - they must be copied manually or via the script
- **Each worktree is independent** - changes in one don't affect others until committed and merged
- **Database migrations** should be run from the main repo to avoid conflicts
- **Always run the initialization script** after creating a new worktree

## Troubleshooting

### Script fails with permission errors:
```bash
chmod +x worktree-init.sh
```

### Environment files missing:
Check that the files exist in the main repo:
```bash
ls -la /Users/raywalker/source/Draco/draco-nodejs/backend/.env
ls -la /Users/raywalker/source/Draco/draco-nodejs/frontend-next/.env.local
```

### Build fails after setup:
1. Check that all dependencies are installed
2. Ensure Prisma client is generated
3. Verify environment variables are correct

### Prisma client issues:
```bash
cd draco-nodejs/backend
npx prisma generate
```

## Best Practices

1. **Use descriptive worktree names**: `git worktree add ../draco-email-feature feat/email`
2. **Run initialization script immediately** after creating worktree
3. **Keep worktrees up to date** with main branch regularly
4. **Clean up old worktrees** when features are merged
5. **Use separate terminal tabs** for each worktree to avoid confusion
# Quick Setup Guide

## 1. Fix PowerShell Execution Policy

Open PowerShell as **Administrator** and run:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Close PowerShell, open a new regular (non-admin) PowerShell window, and verify:

```powershell
npm -v
node -v
git --version
```

All three commands should now work without errors.

## 2. Fix Git Repository Corruption

Your Git repository has a corrupt object. Here's how to fix it:

```powershell
# Navigate to project
cd "C:\Users\eduar\OneDrive\Desktop\Viventa RD"

# Remove corrupt Git data
Remove-Item -Recurse -Force .git

# Reinitialize clean repo
git init
git remote add origin https://github.com/eduardoinoa18/viventa-rd.git

# Create main branch
git checkout -b main

# Stage all current changes
git add .

# Commit your changes
git commit -m "feat: complete platform with admin, agent, broker dashboards; custom search; PWA; CI/CD"

# Push to GitHub (use --force since we're rebuilding the repo)
git push -u origin main --force
```

**Important**: The `--force` flag overwrites the remote. Only use this if you're sure you want to replace what's on GitHub with your local version.

## 3. Install Dependencies and Build

```powershell
npm ci
npm run build
```

If the build succeeds, you're ready to deploy!

## 4. Run Tests (Optional)

```powershell
npm run test:e2e
```

## 5. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "Add New Project"
4. Import `eduardoinoa18/viventa-rd`
5. Add environment variables from your `.env.local`:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - Add any other env vars you're using
6. Click "Deploy"

Future pushes to `main` will auto-deploy.

## 6. Configure Firebase Storage CORS

See `FIREBASE-STORAGE-CORS.md` for detailed instructions:

1. Go to Google Cloud Console → Cloud Storage
2. Find your Firebase Storage bucket
3. Edit CORS configuration
4. Paste contents from `firebase/cors.json`
5. Save
6. Verify at `/admin/diagnostics` → click "Probar CORS"

## Troubleshooting

### npm still not working
- Make sure you ran `Set-ExecutionPolicy` as Administrator
- Close ALL PowerShell windows and open a fresh one
- If still failing, restart your computer

### Git push rejected
- If remote has changes you don't have: `git pull origin main --rebase` before pushing
- If you want to overwrite remote with your local version: use `git push --force`

### Build fails
- Delete `node_modules` and `.next` folders
- Run `npm ci` to do a clean install
- Run `npm run build` again

### CI/CD not running
- Check the `.github/workflows/ci.yml` file exists
- Go to your GitHub repo → Actions tab to see workflow runs
- Ensure the workflow file is committed and pushed

## Next Steps

After deployment:
1. Test the live site at your Vercel URL
2. Configure Firebase Storage CORS (required for image uploads)
3. Create a master admin account (see `MASTER-ADMIN-SETUP.md`)
4. Test the full listing creation flow with real uploads

## Documentation

- `PLATFORM-OVERVIEW.md` - High-level architecture and modules
- `CUSTOM-SEARCH.md` - Search implementation details
- `TESTING.md` - E2E tests and manual QA
- `FIREBASE-STORAGE-CORS.md` - Fix upload CORS errors
- `VERCEL-DEPLOYMENT.md` - Deployment guide

# MediFind Deployment Guide

## Problem Fixed: Bcrypt Native Module Error

**Error:** `Error: invalid ELF header` on bcrypt module deployment

**Root Cause:** Native modules compiled on Windows don't work on Linux (Render's platform)

**Solution Implemented:**
1. Added `npm rebuild bcrypt` to postinstall script in `package.json`
2. Created `render.yaml` with proper build command
3. Bcrypt will be recompiled for Linux during Render's deployment

---

## Deployment to Render.com

### Step 1: Push Code to GitHub

```bash
git init
git add .
git commit -m "MediFind v3 - Express, JWT Auth, AI Features"
git remote add origin https://github.com/YOUR_USERNAME/medifind.git
git branch -M main
git push -u origin main
```

### Step 2: Create Render Account & Database

1. **Sign up** at https://render.com
2. **Create PostgreSQL database** (or use external MySQL)
   - Note the database connection string
   - Format: `mysql://user:password@host:port/database`

### Step 3: Deploy on Render

1. **Go to** https://render.com/dashboard
2. **Click** "New +" → "Web Service"
3. **Connect GitHub** repository
4. **Configure:**
   - **Name:** medifind
   - **Environment:** Node
   - **Build Command:** `npm install && npm rebuild bcrypt`
   - **Start Command:** `npm start`

### Step 4: Set Environment Variables

In Render dashboard, go to **Environment** and add:

```
DB_HOST=<your-mysql-host>
DB_PORT=3306
DB_USER=<your-db-user>
DB_PASS=<your-db-password>
DB_NAME=<your-db-name>
JWT_SECRET=your-super-secret-key-here
ADMIN_EMAIL=admin
ADMIN_PASSWORD=secure-password-here
NODE_ENV=production
PORT=10000
```

### Step 5: Initialize Database

1. **Export database schema:**
   ```bash
   mysql -h localhost -u root -p medifind_db < database.sql
   ```

2. **Or manually run** the SQL from `database.sql` on your Render database

3. **Verify:** Connect to your Render database and confirm tables exist

### Step 6: Deploy

1. Click **"Create Web Service"**
2. Render automatically deploys from your GitHub
3. **Wait 2-3 minutes** for deployment
4. View logs to confirm:
   ```
   ✅ MySQL connected
   💊 MediFind v3 – Express Server
   ➜ Your service is live!
   ```

---

## Troubleshooting

### Issue: Build fails with npm errors
**Solution:** Delete `node_modules` and `package-lock.json` locally, commit clean version:
```bash
rm -rf node_modules package-lock.json
npm install
git add .
git commit -m "Clean npm install"
git push
```

### Issue: Database connection error
**Solution:** Verify environment variables are set correctly:
- Check DB_HOST matches your database provider
- Confirm DB credentials are correct
- Ensure database is running and accessible

### Issue: Bcrypt still failing
**Solution:** The `render.yaml` includes rebuild. If it still fails:
1. Check Render build logs for errors
2. Verify Node version (should be 18+)
3. Try clearing build cache in Render dashboard

### Issue: Port conflicts
**Solution:** Render uses port 10000 internally. Set `PORT=10000` in Render environment variables.

---

## Database Setup for Render

### Option 1: Render PostgreSQL (FREE)
1. Create Render PostgreSQL database
2. **Modify** `config/db.js` to use PostgreSQL instead of MySQL
3. Export your SQL schema to PostgreSQL format

### Option 2: External MySQL (AWS RDS, DigitalOcean, etc.)
1. Create external MySQL database
2. Get connection string
3. Add to Render environment variables
4. Run `database.sql` on the external database

### Option 3: Local MySQL on Your Computer
⚠️ **Not recommended** for production - your Render server won't access your home PC
- Works only if you have a static IP and open ports
- Better to use a cloud database

---

## Post-Deployment

### Verify Deployment
```bash
curl https://medifind-xxxx.onrender.com/api/health
# Expected response: {"status":"ok"}
```

### Test Login
```bash
curl -X POST https://medifind-xxxx.onrender.com/api/login \
  -H "Content-Type: application/json" \
  -d '{"role":"USER","email":"user@test.com","password":"user123"}'
```

### Monitor Logs
- In Render dashboard, click your service
- View "Logs" tab in real-time
- Check for any errors

---

## Frontend Deployment (Optional)

Deploy your frontend separately to Vercel/Netlify:

1. **Vercel:**
   ```bash
   npm install -g vercel
   vercel --prod
   ```
   - Set `REACT_APP_API_URL=https://medifind-xxxx.onrender.com` in `.env`

2. **Or** update `index.html` to point to your Render backend URL

---

## Key Files for Deployment

✅ **render.yaml** - Render configuration (NEW)
✅ **package.json** - Updated with rebuild script (MODIFIED)
✅ **.env** - Local development (NEW)
✅ **.env.example** - Template for deployment (EXISTING)
✅ **database.sql** - Database schema
✅ **server.js** - Express server entry point

---

## Verification Checklist

- [ ] GitHub repository is public
- [ ] All environment variables set in Render
- [ ] Database is created and accessible
- [ ] `npm rebuild bcrypt` completes successfully
- [ ] Server logs show "✅ MySQL connected"
- [ ] Can login with test credentials
- [ ] AI suggestion endpoint works
- [ ] API routes respond correctly
- [ ] Dashboard pages load with authentication

---

## Support

If you encounter issues:
1. Check Render build logs for specific errors
2. Verify environment variables match your setup
3. Ensure database has proper schema (run `database.sql`)
4. Check Node version compatibility (18+)

Happy deploying! 🚀

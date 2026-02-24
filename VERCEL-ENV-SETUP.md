# 🚀 VERCEL ENVIRONMENT VARIABLES SETUP
## To fix 401/500 errors

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

## ✅ Required Variables (Copy these EXACTLY)

### 1. Firebase Admin SDK Credentials
```
FIREBASE_ADMIN_PROJECT_ID=viventa-2a3fb
```

```
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-fbsvc@viventa-2a3fb.iam.gserviceaccount.com
```

```
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQC4i5kyWjY/41CI\nrZZ+OD6mOex1GgT8zcQ6uiQcUhfaZACMWXa+Kg0JpQvWZn3N5r1QoY+SRdEiyH3u\nNm5usdmdFUpuk++t5Kfg7m/GOBvT/YkPOSOBzt7NQPgVSLYeFEs3n56J7NZd2QYf\nkdtSRKZYnnGK4l9Ea6gp2PJgGXAFISGZRTq1jMCO8TjH897H2cKOvMSLZRMfXQmI\nL6lk/cy5kAWaoIIxcK6S9IaTLe1UhuiplgyEvqpkUIZ2h/W5GRRtPYvq8ZBi/pCn\n5iP0TNMXbPdMvj2Mhv1+S1q0nBj/QP/1/k4IARUj2VooCVei0XjS5vzC0790v0+Y\n05wCwUIVAgMBAAECggEAARp8fW83ofGRYnVbi375Vot3z8i53cocL2upuhzpBsTt\nYRo4jr7kK8Gm8hlUGSA82Ye664c2IQcsqItsXu3oPbzwMqDmwHL+JXYzVPfW/bXI\n2b5qnQrvHBfp2GiLYcDsbhJSfXFHuXpiXBibryzOaOviqWsi1gziyrT63rM1klLX\nZrkCBgeT7KfjUrveZa1RAFgS5UGaxmzVhrEbzcGZEgVtXc6jxf7BoEcyyhcgJULr\n+Pw5dFnD9keFItHlKzYIF6poDjK/caUq7tsUvMmsjw1Q9lAqtIrTbiSTPpQBEX/d\nY3LXEguI2LMD6WX28Lmc1IArk+C0KsgYmdY+4hxAYQKBgQD3jewOaHYHOhJe2Hcm\nqi3x3PmCfdyJbe1YYbg3fVB8/irZPcpFCHuZMMaOxgK+DxOscHrHB+xABmu220lV\nfIJ7mP3yl8kYfpzjDuhByyZBxdZMV6AhEH7qImz1uWPFOHlWInXiMcWdL7EC/Smh\nxJDy+Ju9inVzKQybeRly/qPCtQKBgQC+117wOLllsPskiC664sKCUAxgsGro6Zn4\nH37r8lFxy7qP16g7LJvU6XABlUaHz19gBwxw37Ra1HHRrbfg/VyHb1s6BIMQjKcL\ntX5Y9Og/orE/ok7WrCrPig+2gJFVjhjgHa+y6Mo4AVBAEElv59R6XKN3XvIcsY/o\nXC2RsHY94QKBgC8p5N1h3YrG75UOXLULGzHHTeoknI26WcvK4lQAFgOaUQOOmCjK\n0vF+r3WoGAGp0a+6xkmBIuuXzZHK+Y/F5v4xScCcVn3KMY2421sdny5MyOVGlIV4\nJRXqdSPjrDR46/UTH652mRW3blwJa5McZhlEcDeOV44XNgWw7r5P8Vc5AoGAZmkr\nAFxgWUrlKtCNyype2RFd4xEo/f5F6tn0AWgS/q8mWYSQOdkRcusmeSMDK2REOULv\nES9rGIcC4VOI5orv+Znvaa38K4hfKDBoMhKTA3sqBQzzo83WV3MuRXCvDSto+/PS\nUn8L7Yv+5bIXxp6w7k0CR8/Cu1Up9bZpmdIJUeECgYACV/gpQl75mytfCcxKTmPr\nDI3K1zIC7s/AwPXKZJTEDizfhBLKVYrGEvFQ0jB/pCiK8FDOfZ5N0Bbe7L6lmmJU\nhu8Md94KsVZNXBTKTMuu4X6Iigcv8axcZSeUMwJR8G4/ok5OATmf88jp5rPc9MLU\n+9ATAaxJZDpLuX0ia37c+A==\n-----END PRIVATE KEY-----\n"
```

### 2. Firebase Public Config
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBbfVSutdfIEQGRIQm7CvsahpXRF4R1uTk
```

```
NEXT_PUBLIC_FIREBASE_PROJECT_ID=viventa-2a3fb
```

### 3. Session Secret (GENERATE NEW FOR PRODUCTION)
```
SESSION_SECRET=your-random-32-char-secret-here-change-this-in-production
```
⚠️ Generate a secure random string for production! Use: `openssl rand -base64 32`

### 4. Master Admin Email
```
MASTER_ADMIN_EMAIL=viventa.rd@gmail.com
```

---

## 📋 Important Notes:

1. **Set for ALL environments**: Production, Preview, Development
2. **After setting variables**: Trigger a new deployment (Deployments → Redeploy)
3. **FIREBASE_ADMIN_PRIVATE_KEY**: Copy the ENTIRE value including quotes and \n characters
4. **Verify in logs**: After redeploy, check Function Logs for `[ADMIN]` messages

---

## 🔍 Verify Setup:

After setting variables and redeploying, visit:
```
https://your-preview-url/api/debug/env
```

This will show which variables are detected (preview/dev only).

---

## ⚡ Quick Checklist:
- [ ] Copy all variables above to Vercel
- [ ] Set for Production environment
- [ ] Set for Preview environment  
- [ ] Generate and set unique SESSION_SECRET
- [ ] Trigger redeploy
- [ ] Check `/api/debug/env` endpoint
- [ ] Test login again

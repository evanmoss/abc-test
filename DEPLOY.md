# Deploying to CDN

Your alphabet app is fully static and ready for CDN deployment!

## Option 1: AWS S3 + CloudFront

### Quick Deploy
```bash
# Make script executable
chmod +x deploy.sh

# Create bucket and deploy (first time)
./deploy.sh my-alphabet-app --create

# Just deploy (subsequent updates)
./deploy.sh my-alphabet-app
```

### Add CloudFront CDN
1. Go to AWS CloudFront console
2. Create Distribution → Origin: your S3 bucket
3. Enable caching, HTTPS, and edge locations

---

## Option 2: Netlify (Easiest)
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=.
```

---

## Option 3: Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

---

## Option 4: Cloudflare Pages
1. Push to GitHub
2. Connect repo in Cloudflare Pages dashboard
3. Set build output directory to `/`

---

## Option 5: GitHub Pages
1. Push to GitHub repo
2. Settings → Pages → Deploy from branch
3. Select `main` branch

---

## Files Included
- `index.html` - Main page
- `styles.css` - Styling
- `script.js` - App logic
- `assets/` - Images (26 letter PNGs)
- `assets/sounds/` - Audio files (optional)

# Deployment Guide

## Cloudflare Pages Setup

### 1. Connect Repository
- Go to Cloudflare Pages Dashboard
- Click "Create a project"
- Connect your GitHub repository: `saas-frontend`

### 2. Build Configuration
- **Framework preset**: Vite
- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Root directory**: (leave empty)
- **Node version**: 18 or higher

### 3. Environment Variables
Go to Settings > Environment variables and add these for **Production**:

```
VITE_API_URL=https://saas-backend-83xm.onrender.com/api
VITE_COMPANY_ID=a286fe51-57df-4ff1-baee-e1c0f9df56a8
```

**Important**: Replace `VITE_COMPANY_ID` with your actual company UUID from the database.

### How to get your Company ID:
1. Login to your app with admin credentials
2. Open Browser DevTools (F12)
3. Go to Application tab > Local Storage
4. Find the `token` key and copy its value
5. Go to https://jwt.io
6. Paste the token in the "Encoded" field
7. Look for `companyId` in the decoded payload

### 4. Deploy
- Save the configuration
- Click "Save and Deploy"
- Wait for the build to complete (usually 2-3 minutes)

### 5. Custom Domain (Optional)
- Go to Custom domains
- Add your domain (e.g., `catalogo.tuempresa.com`)
- Update DNS records as instructed

## Troubleshooting

### Products not loading in catalog
- Verify `VITE_API_URL` is correct and backend is accessible
- Verify `VITE_COMPANY_ID` matches a company in your database
- Check browser console for API errors

### "Product not found" error
- Open browser console (F12) and check the logs
- Verify the API URL being used
- Test the public catalog endpoint directly:
  `https://saas-backend-83xm.onrender.com/api/products/public/YOUR_COMPANY_ID`

### Build fails
- Check the build logs in Cloudflare Pages
- Verify all dependencies are in `package.json`
- Try running `npm run build` locally first

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API endpoint | `https://your-backend.onrender.com/api` |
| `VITE_COMPANY_ID` | UUID of the company/tenant | `a286fe51-57df-4ff1-baee-e1c0f9df56a8` |

## Deploy from CLI (Alternative)

```bash
# Install Wrangler
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Build the project
npm run build

# Deploy
npx wrangler pages deploy dist --project-name saas-frontend
```

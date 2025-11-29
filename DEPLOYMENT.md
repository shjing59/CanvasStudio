# Deployment Guide

This project is configured for GitHub Pages deployment.

## Setup Instructions

### 1. Create GitHub Repository

If you haven't already:

```bash
git remote add origin https://github.com/yourusername/CanvasStudio.git
git branch -M main
git push -u origin main
```

**Important**: Replace `yourusername` with your actual GitHub username.

### 2. Update Configuration

Update the `homepage` field in `package.json` with your actual GitHub username:

```json
"homepage": "https://yourusername.github.io/CanvasStudio"
```

### 3. Deploy to GitHub Pages

Run the deployment command:

```bash
yarn deploy
```

This will:
- Build your project (`yarn build`)
- Create/update a `gh-pages` branch
- Push the built files to that branch

### 4. Enable GitHub Pages

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Pages**
3. Under **Source**, select:
   - Branch: `gh-pages`
   - Folder: `/ (root)`
4. Click **Save**

Your site will be live at: `https://yourusername.github.io/CanvasStudio/`

## Subsequent Deployments

After making changes:

```bash
git add .
git commit -m "Your commit message"
git push origin main
yarn deploy
```

## Local Preview of Production Build

To test the production build locally before deploying:

```bash
yarn build
yarn preview
```

## Troubleshooting

### 404 Errors for Assets

If you see 404 errors for CSS/JS files:
- Ensure `base` is set correctly in `vite.config.ts`
- Make sure it matches your repository name with slashes: `/CanvasStudio/`

### Custom Domain

To use a custom domain:
1. Add a `CNAME` file to the `public` folder with your domain
2. Configure your domain's DNS settings
3. Enable HTTPS in GitHub Pages settings

## Alternative: GitHub Actions (Automatic Deployment)

For automatic deployment on every push, see the GitHub Actions workflow option in the main README.


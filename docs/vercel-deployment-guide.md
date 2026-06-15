# Vercel Deployment Guide
## Task Management System Frontend (SPA)

This guide details the step-by-step process of deploying the React + Vite single-page application (SPA) frontend of the Task Management System (TMS) to **Vercel**.

---

## Part 1: SPA Routing Configuration (`vercel.json`)

Vite React builds produce a Single Page Application (SPA). By default, client-side routing (e.g., React Router) will fail with a `404 Not Found` when a user reloads the page or accesses a direct nested path (like `/dashboard` or `/login`) because Vercel looks for a physical file at that path.

To prevent this, the repository contains a `frontend/vercel.json` file configuration:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

This configuration tells Vercel's edge router to rewrite all incoming URLs to `index.html`, letting React Router handle routing on the client side.

---

## Part 2: Step-by-Step Vercel Deployment

1. **Log in to Vercel**: Go to [vercel.com](https://vercel.com) and log in (using your GitHub account).
2. **Import Project**:
   - From your dashboard, click **Add New...** and select **Project**.
   - Connect and select your Task Management System GitHub repository.
3. **Configure Project Settings**:
   - **Framework Preset**: Select **Vite** (Vercel should auto-detect this).
   - **Root Directory**: Click *Edit* and select **frontend** (since the React app resides in the `frontend/` folder).
   - **Build and Output Settings**:
     - Keep the defaults (Build Command: `npm run build`, Output Directory: `dist`, Install Command: `npm install` or `npm ci`).
4. **Configure Environment Variables**:
   - Expand the **Environment Variables** section.
   - Add the following environment variables (which Vite requires at build time to embed in the static bundle):

| Key | Value | Notes |
| :--- | :--- | :--- |
| `VITE_API_URL` | `https://your-backend-api.onrender.com` | The public URL of your deployed Render backend (no trailing slash). |
| `VITE_SOCKET_URL` | `https://your-backend-api.onrender.com` | The public URL of your deployed Render backend (same as API URL for Socket.io). |

5. **Deploy**:
   - Click the **Deploy** button.
   - Vercel will clone the repo, install dependencies, compile the Vite app with the environment variables, and deploy it to a staging URL (e.g., `https://task-management-system-xxx.vercel.app`).

---

## Part 3: Verification

- **Production URL**: Once deployed, Vercel will provide a production domain. Copy this domain (e.g., `https://tms-flow.vercel.app`).
- **Update Backend CORS**:
  - Go back to your **Render.com** dashboard for the backend service.
  - Update the `CLIENT_ORIGIN` environment variable to match your new production Vercel URL (e.g., `https://tms-flow.vercel.app`).
  - Render will automatically restart the backend service to apply the change.
- **Testing**:
  - Load the Vercel site, verify you can register/login.
  - Navigate around (e.g. to `/tasks`), reload the page, and verify that routing works and does not return a 404.
  - Open developer console and check for any CORS or connection warnings.

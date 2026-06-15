# Render.com Deployment Guide
## Task Management System Backend & Database

This guide details the step-by-step process of deploying the PostgreSQL database and Express API backend of the Task Management System (TMS) to **Render.com**.

---

## Part 1: Managed PostgreSQL Database Setup

Render provides fully managed PostgreSQL databases. We will set this up first, as the backend service requires the database connection string.

1. **Log in to Render**: Go to [dashboard.render.com](https://dashboard.render.com) and log in.
2. **Create Database**:
   - Click **New +** at the top right of the dashboard and select **PostgreSQL**.
   - Fill in the database details:
     - **Name**: `tms-db-prod` (or any preferred identifier)
     - **Database**: `tms_prod_db`
     - **User**: `postgres`
     - **Region**: Select a region close to your target users (e.g., `Singapore` or `Oregon`).
     - **PostgreSQL Version**: Select **15** (matching our development environment).
     - **Plan**: Select **Free** (or your preferred paid tier).
   - Click **Create Database**.
3. **Retrieve Connection URI**:
   - Once the database status changes to **Available**, scroll down to the **Connection Info** section.
   - Copy the **External Connection String** (used for local administration/migrations) and **Internal Connection String** (used by other Render services in the same region).
   - You will use the **Internal Connection String** as the `DATABASE_URL` for the backend service.

---

## Part 2: Express API Backend Setup

We will deploy the backend as a **Web Service** on Render.

1. **Create Web Service**:
   - Click **New +** and select **Web Service**.
   - Connect your GitHub repository containing the Task Management System.
2. **Configure Web Service settings**:
   - **Name**: `tms-backend-api`
   - **Region**: **Must be the same region** as your PostgreSQL database for optimal performance and internal networking.
   - **Branch**: Select the branch you want to deploy from (typically `main` or `dev`).
   - **Root Directory**: `backend` (since our backend codebase is in the `backend/` subfolder).
   - **Runtime**: `Node`
   - **Build Command**: 
     ```bash
     npm ci && npx prisma generate
     ```
   - **Start Command**: 
     ```bash
     npx prisma migrate deploy && npm run start
     ```
     *(This runs migrations on every deploy to keep the DB schema updated before starting the API)*
   - **Plan**: Select **Free** (or preferred tier).

3. **Configure Environment Variables**:
   - Click the **Advanced** button or navigate to the **Env Groups / Environment** tab on the left.
   - Add the following environment variables:

| Key | Value | Notes |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables Express production optimizations. |
| `PORT` | `3000` | (Optional) Render automatically assigns a random PORT, but setting it explicitly is good practice. |
| `DATABASE_URL` | *[Your Internal Connection String]* | Paste the **Internal Connection String** copied in Part 1. |
| `JWT_SECRET` | *[Your Cryptographically Secure Key]* | Generate a high-entropy string (e.g., via `openssl rand -hex 32` or a password generator). |
| `JWT_EXPIRES_IN` | `24h` | Token expiration period. |
| `CLIENT_ORIGIN` | `https://your-frontend-domain.vercel.app` | The production URL of your deployed Vercel frontend (no trailing slash). |

4. **Deploy Service**:
   - Click **Create Web Service**.
   - Render will build the image, run migrations, and spin up the service.
   - Note down the public URL of your web service (e.g. `https://tms-backend-api.onrender.com`). You will need this for the frontend configuration.

---

## Part 3: Troubleshooting & Verification

- **Log Streams**: Check the **Logs** tab in the Render dashboard. A successful deploy shows:
  ```
  Prisma Schema Loaded...
  Applying migrations...
  Migrations successfully applied.
  Server running on port 3000
  ```
- **Health Check**: Test the health route in a browser or curl:
  ```bash
  curl https://tms-backend-api.onrender.com/api/health
  ```
  Expected JSON output: `{"status":"ok","db":"connected",...}`

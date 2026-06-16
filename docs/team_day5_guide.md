# Day 5 Team Integration Guide

This guide is designed for **Members 1, 2, 3, and 4** to execute their Day 5 tasks using the **AntiGravity** coding assistant. It covers Git workflows, workspace setups, and verification steps.

---

## 🚦 Current Status & Workflow Order

To prevent conflicts and ensure a smooth delivery:
1. **🛡️ Member 2 (Security) — [COMPLETED]**
   - Security configurations, inputs sanitization, token blacklists, and linter fixes have been pushed to `dev`.
2. **🎨 Member 3 (Frontend UX) — [COMPLETED]**
   - Responsive layout fixes, skeleton loading cards, form validations, and global Toast alert systems have been integrated.
3. **🗄️ Member 4 (API Testing) — [IN PROGRESS/NEXT]**
   - Prepare the Postman collection, verify validation/sanitization responses, and generate test reports.
4. **👑 Member 1 (Team Lead) — [FINAL STEP]**
   - Complete README.md, review end-to-end integration, and merge the final `dev` branch into `main` for release.

---

## 🚀 Pre-requisites for Members 3, 4, and 1

Before starting your day 5 tasks, pull the security updates implemented by Member 2. Run these commands:

```bash
# 1. Fetch the latest branches from the remote
git fetch origin

# 2. Make sure you are on the dev branch
git checkout dev

# 3. Pull Member 2's security hardening changes
git pull origin dev
```

---

## 🛡️ Member 2: Security | OWASP Hardening [COMPLETED]

### **Goal**: Configure Helmet, rate limiters, input sanitization, JWT algorithm pinning, password complexity, and production error masking.

### **Summary of Completed Work**:
* **Helmet Headers**: Integrated security-focused HTTP headers inside [app.js](file:///c:/Users/LENOVO%20LOQ/TaskManagement/backend/src/app.js) (CSP, HSTS, frameguard, xssFilter, noSniff).
* **Dual-Layer Rate Limiting**: Added global rate limits (100 reqs/15m) and stricter auth rate limits (10 reqs/15m) inside [app.js](file:///c:/Users/LENOVO%20LOQ/TaskManagement/backend/src/app.js).
* **XSS & SQLi Sanitization**: Developed a custom regex sanitization middleware in [sanitizeMiddleware.js](file:///c:/Users/LENOVO%20LOQ/TaskManagement/backend/src/middleware/sanitizeMiddleware.js) checking payload size (5000 char max) and blocking script blocks, SQL keywords, and suspicious quotes.
* **JWT & Passwords**: Forced authentication verification to use the `HS256` algorithm in [authMiddleware.js](file:///c:/Users/LENOVO%20LOQ/TaskManagement/backend/src/middleware/authMiddleware.js) and implemented token blacklisting upon logout in [tokenBlacklist.js](file:///c:/Users/LENOVO%20LOQ/TaskManagement/backend/src/middleware/tokenBlacklist.js). Complex password policies are enforced via Zod in [authSchemas.js](file:///c:/Users/LENOVO%20LOQ/TaskManagement/backend/src/validators/authSchemas.js).

### **How to Verify Locally**:
1. Run the local backend server:
   ```powershell
   # Inside backend directory
   $env:NODE_ENV="development"
   $env:DATABASE_URL="postgresql://postgres.fyqskrbxrqrxmlwnzxrr:Dayalan123!26@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres"
   $env:JWT_SECRET="local-prod-test-secret"
   $env:CLIENT_ORIGIN="http://localhost:5173"
   $env:PORT="3001"
   node src/app.js
   ```
2. In a separate terminal run the audit test suite:
   ```bash
   node "C:\Users\LENOVO LOQ\.gemini\antigravity-ide\brain\ab5cddc8-8125-48b5-85b6-0df46ffc75c2\scratch_security_test.js"
   ```
3. All 8 security checks should pass successfully, confirming robust OWASP defenses!

---

## 🎨 Member 3: Frontend | Polish & Responsive UX [COMPLETED]

### **Goal**: Fix responsive layout issues (hamburger menus, horizontal scroll Kanban), implement skeleton load states, inline form validations, and a global Toast alerting system.

### **Step-by-step Execution**:
1. Open the TaskManagement workspace, checkout `dev`, and run `git pull origin dev`.
2. Open the **AntiGravity Chat** interface.
3. Paste the following prompt into AntiGravity to start executing your tasks:
   ```text
   Review our React frontend and perform a final UI/UX polish.
   
   Specifically:
   1. Look at frontend/src/components and pages. Fix the responsive Dashboard Sidebar layout so it displays a hamburger menu toggle on mobile devices, and configure the Kanban Board so it scrolls horizontally on smaller screens instead of wrapping/breaking.
   2. Create a SkeletonCard.jsx loading placeholder component and place page loaders to show during API calls.
   3. Update our forms (Login, Register, and Create Task) to show inline validation UI errors (e.g. red borders, explicit error text) when Zod returns validation failures.
   4. Create a Toast notification system (ToastContext.jsx and Toast.jsx) allowing components to trigger success/error notification banners.
   5. Standardize our status/role badge colors (ADMIN = purple, PROJECT_MANAGER = blue, COLLABORATOR = gray).
   ```
4. Verify your layout updates locally:
   ```bash
   cd frontend
   npm run dev
   ```
5. Inspect pages on mobile viewports using Chrome DevTools (press `F12` > Device Mode toggle).
6. Once validated, commit and push your changes to `dev`:
   ```bash
   git add frontend/
   git commit -m "style: implement responsive sidebar/Kanban board, skeletons, form validations, and toast system"
   git push origin dev
   ```

---

## 🗄️ Member 4: Testing | QA Functional API Tests

### **Goal**: Design the functional API test coverage matrix, generate a Postman collections JSON, and verify standard security responses.

### **Step-by-step Execution**:
1. Open the TaskManagement workspace, checkout `dev`, and run `git pull origin dev`.
2. Open the **AntiGravity Chat** interface.
3. Paste the following prompt into AntiGravity to generate the test suites:
   ```text
   Design the functional testing plan and generate the Postman collection JSON for our REST API.
   
   Base URL: http://localhost:3000/api/v1
   
   Test accounts:
   - Admin: admin@tms.com / Admin@123!
   - Project Manager: pm@tms.com / Manager@123!
   - Collaborator: collab@tms.com / Collab@123!
   
   Please output:
   1. A functional test cases table mapping all endpoints, expected response status codes (200, 201, 400, 401, 403), inputs, and required actor roles.
   2. A valid Postman collection v2.1 JSON structure that supports folders for Auth, Users, Tasks, Comments, and Notifications. Include pre-request login scripts to save authorization tokens.
   3. A step-by-step execution guide explaining how to import and run these tests using Newman or the Postman Collection Runner.
   ```
4. Save the generated Postman collection as `docs/TMS_API_Tests.postman_collection.json`.
5. Save the detailed report as `docs/functional_testing_report.md`.
6. Stage, commit, and push your files:
   ```bash
   git add docs/
   git commit -m "test: add Postman collections JSON and functional API test report"
   git push origin dev
   ```

---

## 👑 Member 1: Team Lead | Final Integration & README

### **Goal**: Write the complete production README.md, end-to-end flow validation, SRS validation checklist, and demo presentation script.

### **Step-by-step Execution**:
1. Open the TaskManagement workspace, checkout `dev`, and run `git pull origin dev`.
2. Verify that Member 3 and Member 4 have successfully pushed their modifications.
3. Open the **AntiGravity Chat** interface.
4. Paste the following prompt into AntiGravity:
   ```text
   Generate the final submission documentation and README.md for our Task Management System.
   
   Project Details:
   - Course: INTE 21323
   - Stack: React + Vite, Express, Prisma, PostgreSQL, Docker, Socket.io
   - Live Web App: https://task-management-virid-xi.vercel.app
   - Backend API URL: https://task-management-backend-lt0f.onrender.com
   - Swagger Documentation: https://task-management-backend-lt0f.onrender.com/api/docs/
   
   Please generate:
   1. A comprehensive, beautifully formatted README.md featuring the Project Title, tech stack table, local setup guides, environment variables configuration, and a table of Team Contributions.
   2. An SRS requirements validation checklist validating how each requested feature (RBAC, WebSockets, JWT Auth) was met.
   3. A structured, 5-minute product walkthrough demo script.
   ```
5. Save the generated text as **`README.md`** in the project's root folder.
6. Commit and push the submission documents:
   ```bash
   git add README.md
   git commit -m "docs: generate project README and final submission guidelines"
   git push origin dev
   ```

---

## 🏁 Final Step: Production Release

After all team members have finalized their pushes on `dev` and the Team Lead has verified the features end-to-end, perform the final merge to trigger the production builds:

```bash
# 1. Switch to dev and pull all team changes
git checkout dev
git pull origin dev

# 2. Switch to main
git checkout main

# 3. Pull latest main to avoid divergence
git pull origin main

# 4. Merge dev branch into main
git merge dev

# 5. Push main to remote repository to trigger Render and Vercel builds
git push origin main
```

# Functional Test Plan & Postman Execution Guide

This document outlines the functional test cases for the Task Management System REST API and explains how to execute the Postman collection.

---

## 1. Functional Test Cases Table

| Folder | Request Name | Method | Endpoint Path | Required Role | Request Inputs (Body/Query) | Expected Status | Description & Assertions |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Auth** | Register User | `POST` | `/auth/register` | Public | `{ name, email, password, role }` | `201 Created` or `400 Bad Request` | Registers a test user. Asserts success response or failure if email exists. |
| **Auth** | Login as Admin | `POST` | `/auth/login` | Public | `{ email, password }` | `200 OK` | Logs in Admin. Caches `adminToken` and sets `authToken`. |
| **Auth** | Login as PM | `POST` | `/auth/login` | Public | `{ email, password }` | `200 OK` | Logs in PM. Caches `pmToken` and sets `authToken`. |
| **Auth** | Login as Collaborator | `POST` | `/auth/login` | Public | `{ email, password }` | `200 OK` | Logs in Collaborator. Caches `collabToken` and sets `authToken`. |
| **Auth** | Login Failure | `POST` | `/auth/login` | Public | `{ email, password }` (invalid) | `401 Unauthorized` | Asserts standard `UNAUTHORIZED` error payload. |
| **Auth** | Reset Password | `POST` | `/auth/reset-password` | Public | `{ token, newPassword }` | `501 Not Implemented` | Asserts stub response. |
| **Auth** | Logout | `POST` | `/auth/logout` | Token Owner | None (Header: Bearer Token) | `200 OK` | Clears active token. |
| **Users** | Create User | `POST` | `/users` | `ADMIN` | `{ name, email, role }` | `201 Created` | Admin creates a user. Generates temporary password. Caches `createdUserId`. |
| **Users** | List Users (Admin) | `GET` | `/users` | `ADMIN` | Query: `search`, `role`, `page`, `limit` | `200 OK` | Lists users. Asserts pagination and user attributes. |
| **Users** | List Users (Collab) | `GET` | `/users` | `COLLABORATOR` (Deny) | None | `403 Forbidden` | Asserts access is forbidden for collaborators. |
| **Users** | Get User Details | `GET` | `/users/:id` | `ADMIN` or Self | Path: `id` | `200 OK` | Fetches details. Asserts correct ID returned. |
| **Users** | Update User | `PUT` | `/users/:id` | `ADMIN` or Self | `{ name }` | `200 OK` | Updates profile. Asserts update matches input. |
| **Users** | Update Role | `PATCH` | `/users/:id/role` | `ADMIN` | `{ role }` | `200 OK` | Updates user role. |
| **Users** | Deactivate User | `PATCH` | `/users/:id/deactivate` | `ADMIN` | Path: `id` | `200 OK` | Deactivates profile. Asserts `isActive: false`. |
| **Users** | Delete User | `DELETE` | `/users/:id` | `ADMIN` | Path: `id` | `200 OK` | Soft deletes user. |
| **Tasks** | Create Task | `POST` | `/tasks` | Any | `{ title, description, status, priority, projectId }` | `501 Not Implemented` | Asserts stub status. |
| **Tasks** | List Tasks | `GET` | `/tasks` | Any | Query: `status`, `priority` | `501 Not Implemented` | Asserts stub status. |
| **Tasks** | Get Task Details | `GET` | `/tasks/:id` | Any | Path: `id` | `501 Not Implemented` | Asserts stub status. |
| **Tasks** | Update Task | `PUT` | `/tasks/:id` | Any | `{ title, status }` | `501 Not Implemented` | Asserts stub status. |
| **Tasks** | Assign Task | `PATCH` | `/tasks/:id/assign` | Any | `{ userId }` | `501 Not Implemented` | Asserts stub status. |
| **Tasks** | Update Status | `PATCH` | `/tasks/:id/status` | Any | `{ status }` | `501 Not Implemented` | Asserts stub status. |
| **Tasks** | Delete Task | `DELETE` | `/tasks/:id` | Any | Path: `id` | `501 Not Implemented` | Asserts stub status. |
| **Comments** | Create Comment Fail | `POST` | `/tasks/:taskId/comments` | Any | `{ body }` (Non-existent task) | `404 Not Found` | Asserts `TASK_NOT_FOUND` on invalid task ID. |
| **Comments** | Get Comments Fail | `GET` | `/tasks/:taskId/comments` | Any | Path: `taskId` (Non-existent) | `404 Not Found` | Asserts `TASK_NOT_FOUND` on invalid task ID. |
| **Comments** | Delete Comment Fail | `DELETE` | `/comments/:id` | Any | Path: `id` (Non-existent) | `404 Not Found` | Asserts `COMMENT_NOT_FOUND` on invalid comment ID. |
| **Notifications** | Get Notifications | `GET` | `/notifications` | Token Owner | None | `200 OK` | Lists notifications. Caches first notification ID as `notificationId`. |
| **Notifications** | Mark Read | `PATCH` | `/notifications/:id/read` | Owner / `ADMIN` | Path: `id` | `200 OK` | Marks notification as read. Asserts `isRead: true`. |
| **Notifications** | Mark All Read | `PATCH` | `/notifications/read-all` | Token Owner | None | `200 OK` | Marks all notifications as read. |
| **Health** | Health Check | `GET` | `/health` | Public | None | `200 OK` | Asserts status is `"ok"` and db is `"connected"`. |

---

## 2. Postman Collection Architecture & Automation

The generated Postman collection has been written to:
[TMS_API_Tests.postman_collection.json](file:///c:/Users/user/Desktop/webproject/TaskManagement-1/docs/TMS_API_Tests.postman_collection.json)

### Folder Structure
- `1. Auth`: Manual test flows for login/logout and validation tests.
- `2. Users`: Token-cached tests requiring `ADMIN` role. Includes negative access controls testing (`403 Forbidden` for Collaborator).
- `3. Tasks`: Target verification for tasks (asserts expected `501 Not Implemented` status code).
- `4. Comments`: Comments routing test (verifies error handling for mock/non-existent relations, asserting `404 Not Found`).
- `5. Notifications`: Notification management tests using variables fetched from the database seed.
- `6. Health`: Public service status check.

### Automated Login Scripts (Pre-request Caching)
Each folder (e.g. `Users`, `Tasks`, `Comments`, `Notifications`) specifies a folder-level **Pre-request Script** that programmatically triggers a login request to verify if a token has been cached yet for the required role.

Example script from the `Users` folder:
```javascript
const baseUrl = pm.collectionVariables.get("baseUrl");
const email = pm.collectionVariables.get("adminEmail");
const password = pm.collectionVariables.get("adminPassword");

if (!pm.collectionVariables.get("adminToken")) {
    pm.sendRequest({
        url: baseUrl + "/auth/login",
        method: "POST",
        header: { "Content-Type": "application/json" },
        body: {
            mode: "raw",
            raw: JSON.stringify({ email: email, password: password })
        }
    }, function (err, res) {
        if (!err && res.code === 200) {
            const token = res.json().token;
            pm.collectionVariables.set("adminToken", token);
            pm.collectionVariables.set("authToken", token);
        }
    });
} else {
    pm.collectionVariables.set("authToken", pm.collectionVariables.get("adminToken"));
}
```

---

## 3. Step-by-Step Execution Guide

You can run these tests in the GUI via **Postman Collection Runner**, or in the terminal using **Newman**.

### Option A: Using the Postman Collection Runner (GUI)

1. Open Postman.
2. Click **Import** in the top-left menu.
3. Choose the generated JSON file: `docs/TMS_API_Tests.postman_collection.json`.
4. In the left panel, hover over the **Task Management API Tests** collection, click the `...` menu, and select **Run Collection**.
5. Ensure all requests are checked.
6. Verify variables in the collection's **Variables** tab (default is set to `http://localhost:3000/api/v1` and standard credentials).
7. Click **Run Task Management API Tests**.

---

### Option B: Using Newman (CLI Runner)

Newman allows running the tests directly from your terminal or integrating them into a CI/CD pipeline.

#### Step 1: Install Newman
Install Newman globally using npm:
```bash
npm install -g newman
```

#### Step 2: Run Newman locally
Navigate to your repository root and run the command targeting the local port:
```bash
newman run docs/TMS_API_Tests.postman_collection.json --bail
```
*   `--bail`: Stops executing the test suite on the first test failure, useful for rapid feedback.

#### Step 3: Generating HTML Reports (Optional)
If you want to view a visually rich HTML report of the run:
```bash
# Install the HTML reporter
npm install -g newman-reporter-htmlextra

# Run with HTML reports enabled
newman run docs/TMS_API_Tests.postman_collection.json -r htmlextra
```
The report will be created inside a `newman/` folder.

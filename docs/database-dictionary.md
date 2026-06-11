# Database Dictionary

## Users

Stores system user information and authentication details.

| Column | Type |
|----------|----------|
| id | UUID |
| name | String |
| email | String |
| password_hash | String |
| role | ENUM (Admin, Manager, Member) |
| is_active | Boolean |
| created_at | Timestamp |
| updated_at | Timestamp |

---

## Projects

Stores project information created by users.

| Column | Type |
|----------|----------|
| id | UUID |
| title | String |
| description | String |
| created_by | UUID |
| created_at | Timestamp |

---

## Tasks

Stores project tasks and assignment details.

| Column | Type |
|----------|----------|
| id | UUID |
| title | String |
| description | String |
| project_id | UUID |
| assigned_to | UUID |
| created_by | UUID |
| priority | ENUM (Low, Medium, High) |
| status | ENUM (Pending, In Progress, Completed) |
| due_date | Date |
| created_at | Timestamp |
| updated_at | Timestamp |

---

## Comments

Stores comments related to project tasks.

| Column | Type |
|----------|----------|
| id | UUID |
| task_id | UUID |
| user_id | UUID |
| body | Text |
| created_at | Timestamp |

---

## Notifications

Stores user notification records.

| Column | Type |
|----------|----------|
| id | UUID |
| user_id | UUID |
| message | String |
| type | ENUM (Task, Project, System) |
| is_read | Boolean |
| created_at | Timestamp |

---

## Project_Member

Stores user memberships within projects.

| Column | Type |
|----------|----------|
| id | UUID |
| project_id | UUID |
| user_id | UUID |
| role | ENUM (Owner, Manager, Member) |
# Schema Specification

## Database Type
PostgreSQL 15

## Primary Keys
All tables use UUID as Primary Key.

Tables:
- Users
- Projects
- Tasks
- Comments
- Notifications
- Project_Member

---

## Foreign Keys

Projects.created_by
-> Users.id

Tasks.project_id
-> Projects.id

Tasks.assigned_to
-> Users.id

Tasks.created_by
-> Users.id

Comments.task_id
-> Tasks.id

Comments.user_id
-> Users.id

Notifications.user_id
-> Users.id

Project_Member.project_id
-> Projects.id

Project_Member.user_id
-> Users.id

---

## Enumerations

Users.role
- Admin
- Manager
- Member

Tasks.priority
- Low
- Medium
- High

Tasks.status
- Pending
- In Progress
- Completed

Notifications.type
- Task
- Project
- System

Project_Member.role
- Owner
- Manager
- Member
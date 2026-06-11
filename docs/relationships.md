# Relationships Documentation

## User -> Project
One User can create many Projects.
Relationship: 1:N

Foreign Key:
Projects.created_by -> Users.id

---

## Project -> Task
One Project can contain many Tasks.
Relationship: 1:N

Foreign Key:
Tasks.project_id -> Projects.id

---

## User -> Task (Assigned)
One User can be assigned many Tasks.
Relationship: 1:N

Foreign Key:
Tasks.assigned_to -> Users.id

---

## User -> Task (Created)
One User can create many Tasks.
Relationship: 1:N

Foreign Key:
Tasks.created_by -> Users.id

---

## Task -> Comment
One Task can have many Comments.
Relationship: 1:N

Foreign Key:
Comments.task_id -> Tasks.id

---

## User -> Comment
One User can write many Comments.
Relationship: 1:N

Foreign Key:
Comments.user_id -> Users.id

---

## User -> Notification
One User can receive many Notifications.
Relationship: 1:N

Foreign Key:
Notifications.user_id -> Users.id

---

## User <-> Project
Many Users can join many Projects.
Relationship: M:N

Bridge Table:
Project_Member

Foreign Keys:
Project_Member.project_id -> Projects.id
Project_Member.user_id -> Users.id
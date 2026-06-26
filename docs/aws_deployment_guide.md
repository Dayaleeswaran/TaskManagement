# AWS Deployment Guide
## Task Management System (TMS)

This guide provides complete, step-by-step instructions for deploying both the backend API (Node.js/Prisma/Express) and the frontend web client (React/Vite) to Amazon Web Services (AWS). It details two alternative deployment strategies based on your cost, performance, and scaling requirements.

---

## 1. Architectural Overviews

### Architecture A: Single-Instance EC2 (Cost-Effective & Simple)
* **Best for**: Small teams, staging environments, hackathons, or low-budget applications ($10–$20/month).
* **Components**:
  * **AWS EC2**: Runs Docker and Docker Compose. Hosts Nginx, Backend API, and Postgres DB.
  * **Nginx**: Operates as a reverse proxy, SSL termination endpoint (via Let's Encrypt), and serves compiled React static assets.
  * **GitHub Actions**: Connects to EC2 via SSH, pulls new code, and runs `docker-compose up -d --build`.

### Architecture B: Enterprise-Grade (Scalable, Highly Available & Serverless)
* **Best for**: Production environments requiring high availability, automated scaling, zero-downtime rollouts, and deep isolation.
* **Components**:
  * **Frontend**: Hosted on **AWS S3** and distributed worldwide via **Amazon CloudFront CDN** (HTTPS enforced, edge cached).
  * **Backend**: Dockerized containers run in **AWS ECS Fargate** (Serverless container runtime). Exposes REST API and Socket.io over an Application Load Balancer (ALB).
  * **Database**: **AWS RDS PostgreSQL** (Fully managed database with automated backups and multi-AZ replication option).
  * **File Storage**: **AWS S3** bucket (for Supabase or direct attachment storage).

---

## 2. Infrastructure Setup (Architecture A: EC2 + Docker Compose)

If you select the simple EC2 deployment model, follow these steps to prepare your host instance:

### Step 1: Provision the EC2 Instance
1. Log in to the **AWS Management Console** and navigate to **EC2**.
2. Click **Launch Instance**:
   * **Name**: `tms-production-server`
   * **AMI**: `Ubuntu Server 24.04 LTS` (64-bit x86)
   * **Instance Type**: `t3.micro` or `t3.small` (minimum 1GB or 2GB RAM is recommended to compile dependencies).
   * **Key Pair**: Create or choose an existing SSH key pair and download the `.pem` file.
3. **Network Settings**:
   * Allow SSH traffic from `My IP` (for administrator access).
   * Allow HTTP traffic (port 80) from the Internet.
   * Allow HTTPS traffic (port 443) from the Internet.

### Step 2: Install Docker and Docker Compose on EC2
Connect to your EC2 instance via SSH:
```bash
ssh -i "your-key.pem" ubuntu@YOUR_EC2_PUBLIC_IP
```

Run the following commands on the server to install Docker:
```bash
# Update local packages
sudo apt-get update -y
sudo apt-get upgrade -y

# Install Docker dependencies
sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release

# Add Docker’s official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up the stable repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Enable and start Docker service
sudo systemctl enable docker
sudo systemctl start docker

# Add ubuntu user to docker group (avoids needing sudo for docker commands)
sudo usermod -aG docker ubuntu
```
*Note: Log out of SSH (`exit`) and log back in to apply the docker group permissions.*

### Step 3: Clone the Repository and Prep Environment
```bash
# Clone repository
git clone https://github.com/YOUR_GITHUB_ORG/TaskManagement.git
cd TaskManagement

# Create environment configuration files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```
Edit the values in `backend/.env` and `frontend/.env` to match your production credentials (database password, JWT secrets, etc.).

---

## 3. Infrastructure Setup (Architecture B: ECS + RDS + S3 + CloudFront)

If deploying the scalable serverless architecture, follow these steps to provision resources:

### Step 1: Managed Database (AWS RDS PostgreSQL)
1. Go to **AWS RDS Console** -> **Create Database**.
2. **Engine options**: `PostgreSQL`.
3. **Templates**: `Free Tier` or `Dev/Test`.
4. **Settings**:
   * **DB Instance Identifier**: `tms-prod-db-instance`
   * **Master Username**: `postgres`
   * **Master Password**: Choose a strong password and save it securely.
5. **Connectivity**:
   * **Virtual Private Cloud (VPC)**: Select your default VPC or a custom VPC.
   * **Public Access**: Choose `No` (for security).
   * **VPC Security Group**: Create a new group named `rds-security-group`. Add an inbound rule allowing TCP port `5432` from the security group of your future ECS containers.

### Step 2: Container Registry (AWS ECR)
1. Go to **Amazon ECR Console** -> **Create Repository**.
2. **Visibility Settings**: `Private`.
3. **Repository Name**: `tms-backend`.
4. Save and copy the ECR URI (looks like `<aws_account_id>.dkr.ecr.<region>.amazonaws.com/tms-backend`).

### Step 3: Static Website Hosting (AWS S3 & CloudFront)
#### AWS S3 Bucket:
1. Navigate to **S3 Console** -> **Create Bucket**.
2. **Bucket Name**: E.g., `tms-frontend-static-production` (must be globally unique).
3. **Object Ownership**: ACLs disabled.
4. **Block Public Access settings**: Keep all public access blocked (access will be routed through CloudFront CDN via Origin Access Control - OAC).

#### AWS CloudFront Distribution:
1. Go to **CloudFront Console** -> **Create Distribution**.
2. **Origin Domain**: Select the S3 bucket created above.
3. **Origin Access**: Choose `Origin access control settings (recommended)`. Create control settings and click **Create OAC**.
4. **Viewer**:
   * **Viewer Protocol Policy**: `Redirect HTTP to HTTPS`.
   * **Allowed HTTP Methods**: `GET, HEAD, OPTIONS`.
5. **Default Cache Behavior**:
   * Compress Objects Automatically: `Yes`.
6. **Web Application Firewall (WAF)**: Enable or disable based on security policies.
7. **Default Root Object**: Set to `index.html`.
8. Under **Error Pages** tab (critical for Single-Page React apps using client routers):
   * Create custom error response:
     * **HTTP Error Code**: `403: Forbidden` or `404: Not Found`
     * **Customize Error Response**: `Yes`
     * **Response Page Path**: `/index.html`
     * **HTTP Response Code**: `200: OK`
9. Create the distribution. Once created, CloudFront will provide a policy script. Copy that bucket policy and paste it into the **S3 Bucket Permissions** -> **Bucket Policy** editor to allow CloudFront to read your bucket files.

### Step 4: ECS Cluster and Application Load Balancer (ALB)
To handle incoming REST API and WebSocket connections reliably, we configure an Application Load Balancer:

#### Security Groups:
1. Create `alb-sg`: Inbound HTTP (80) and HTTPS (443) from everywhere.
2. Create `ecs-tasks-sg`: Inbound TCP port `3000` from `alb-sg` only.

#### Application Load Balancer (ALB):
1. Create a Load Balancer (Application Load Balancer).
2. Listen on HTTPS port 443 (Requires a domain certificate from AWS Certificate Manager - ACM).
3. Configure target groups:
   * Target Group: `tms-backend-tg` (IP-based, target port `3000`, HTTP, health check path `/api/health`).
   * Enable **Sticky Sessions** (Required for WebSocket connections using `socket.io` to lock client sessions to specific containers).

#### ECS Cluster & Task Definition:
1. Create an ECS Cluster: `tms-cluster`.
2. Under **Task Definitions**, create a new task definition:
   * Family: `tms-backend-task`
   * Launch Type: `FARGATE`
   * CPU: `0.5 vCPU`, Memory: `1.0 GB`
   * **Task Role** & **Task Execution Role**: Set default `ecsTaskExecutionRole`.
   * **Container Definitions**:
     * Name: `backend`
     * Image: `<aws_account_id>.dkr.ecr.<region>.amazonaws.com/tms-backend:latest`
     * Port Mappings: Container Port `3000`, Protocol `tcp`.
     * Environment variables: Set production environment keys (e.g. `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`). Use AWS Secrets Manager or Systems Manager Parameter Store to reference sensitive secrets.
3. Save the task definition as a JSON file locally as `.aws/task-def.json` for the CI/CD pipeline.

---

## 4. CI/CD Secrets Configuration

To run the automated deployment pipeline, add the following secrets to your GitHub repository under **Settings** -> **Secrets and variables** -> **Actions** -> **Repository Secrets**:

| Secret Key | Architecture | Description / Value |
| :--- | :--- | :--- |
| `AWS_ACCESS_KEY_ID` | Both | AWS IAM User access key with permissions to push to ECR, update ECS, and upload to S3. |
| `AWS_SECRET_ACCESS_KEY` | Both | AWS IAM User secret key. |
| `CLOUDFRONT_DIST_ID` | B (Fargate) | CloudFront Distribution ID for front-end invalidations. |
| `VITE_API_URL_PROD` | B (Fargate) | The HTTPS endpoint of the Load Balancer (e.g., `https://api.yourdomain.com`). |
| `VITE_SOCKET_URL_PROD`| B (Fargate) | The HTTPS endpoint of the Load Balancer. |
| `EC2_HOST` | A (EC2) | Public IP address or domain name of the EC2 production server. |
| `EC2_SSH_KEY` | A (EC2) | The private key (`.pem`) used to SSH into the EC2 instance. |
| `BACKEND_ENV` | A (EC2) | Complete text content of the production `.env` file for the backend. |
| `FRONTEND_ENV` | A (EC2) | Complete text content of the production `.env` file for the frontend. |

---

## 5. WebSockets & CORS Setup

WebSockets (Socket.io) and REST CORS headers require careful configuration in production:

1. **Vite API URL Configuration**:
   * Since the React app is served statically, it runs directly in the user's browser. It makes API requests to the Backend URL (`VITE_API_URL`).
   * Verify that `VITE_API_URL` is set to the HTTPS domain pointing to your backend (ALB URL or EC2 Domain) and **not** `localhost`.
2. **Socket.io CORS Setting**:
   * The backend configuration utilizes `cors` and `socket.io` origins.
   * Ensure that `CLIENT_ORIGIN` in backend `.env` contains the exact URL of your production frontend (e.g., `https://yourdomain.com`). Multiple origins can be comma-separated.
3. **Application Load Balancer WebSocket Sticky Sessions**:
   * Because Fargate can run multiple instances of the backend container, the Application Load Balancer must route subsequent HTTP polling/upgrade handshakes to the *same* container instance.
   * Enable **Target Group Stickiness** (using Load Balancer-generated cookies) in the AWS Target Group settings for `tms-backend-tg`.

---

## 6. DB Migration & Seed Procedures

Running migrations automatically on a live deployment must be handled carefully to avoid service interruption:

* **EC2 Deployment (Architecture A)**:
  Migrations are automatically triggered after container startup via Docker Compose command:
  `command: sh -c "npx prisma migrate deploy && npx prisma db seed && npm run start"`
* **ECS Fargate Deployment (Architecture B)**:
  It is dangerous to run migrations from multiple API containers concurrently when scaling.
  * **Option 1**: Configure a single-run ECS task inside the CI/CD pipeline using the AWS CLI:
    ```bash
    aws ecs run-task \
      --cluster tms-cluster \
      --task-definition tms-backend-task \
      --overrides '{"containerOverrides": [{"name": "backend", "command": ["npx", "prisma", "migrate", "deploy"]}]}' \
      --launch-type FARGATE \
      --network-configuration "awsvpcConfiguration={subnets=[SUBNET_ID],securityGroups=[SECURITY_GROUP_ID],assignPublicIp=ENABLED}"
    ```
  * **Option 2**: Run migrations manually before deploying code update:
    SSH temporarily into a jumpbox, or execute `npx prisma migrate deploy` locally while targeting the production database (temporary VPN/bastion access is required as RDS is private).

---

## 7. Logging & Monitoring

For real-time debugging and operation tracing in AWS:
* **EC2 Engine Logs**:
  Run standard docker commands inside the instance:
  ```bash
  docker logs -f tms_backend_prod
  ```
* **ECS Fargate (CloudWatch Logs)**:
  Configure `awslogs` log driver inside the ECS Task Definition. Logs from `stdout` and `stderr` are automatically streamed to **Amazon CloudWatch Logs** under `/ecs/tms-backend-task`.
* **Database Backup**:
  Enable daily automated snapshots in AWS RDS with a retention period of at least 7 days.

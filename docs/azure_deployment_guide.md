# Azure Deployment Guide
## Task Management System (TMS)

This guide provides complete, step-by-step instructions for deploying both the backend API (Node.js/Prisma/Express) and the frontend web client (React/Vite) to Microsoft Azure. It details two alternative deployment strategies based on your cost, performance, and scaling requirements.

---

## 1. Architectural Overviews

### Architecture A: Single-Instance Azure VM (Cost-Effective & Simple)
* **Best for**: Small teams, staging environments, testing, or low-budget applications ($5–$15/month).
* **Components**:
  * **Azure Linux Virtual Machine (VM)**: Runs Docker and Docker Compose. Hosts Nginx, Backend API, and PostgreSQL DB.
  * **Nginx**: Operates as a reverse proxy, SSL termination endpoint (via Let's Encrypt), and serves compiled React static assets.
  * **GitHub Actions**: Connects to Azure VM via SSH, pulls new code, and runs `docker compose up -d --build`.

### Architecture B: Azure-Native Managed Services (Scalable & High Availability)
* **Best for**: Production environments requiring high availability, automated scaling, zero-downtime rollouts, and deep isolation.
* **Components**:
  * **Frontend**: Hosted on **Azure Static Web Apps** (fully managed static site hosting with built-in global CDN, SSL, and custom domains).
  * **Backend**: Dockerized containers run in **Azure Container Apps (ACA)** (fully managed serverless container platform supporting scaling, HTTPS ingress, and WebSockets).
  * **Database**: **Azure Database for PostgreSQL (Flexible Server)** (Fully managed database with automated backups and compute scaling).

---

## 2. Infrastructure Setup (Architecture A: Azure VM + Docker Compose)

If you select the simple VM deployment model, follow these steps to prepare your host instance:

### Step 1: Provision the Azure VM
1. Log in to the [Azure Portal](https://portal.azure.com/).
2. Search for **Virtual machines** -> Click **Create** -> **Azure virtual machine**.
3. **Project Details**:
   * **Resource Group**: Click *Create new* and name it `tms-prod-rg`.
4. **Instance Details**:
   * **Virtual machine name**: `tms-production-server`
   * **Region**: Select your closest region (e.g., East US).
   * **Image**: `Ubuntu Server 24.04 LTS - x64 Gen2`
   * **Size**: `Standard_B1s` or `Standard_B2s` (1GB or 4GB RAM).
5. **Administrator Account**:
   * **Authentication type**: `SSH public key`.
   * **Username**: `azureuser`
   * **SSH key source**: `Generate new key pair`.
   * **Key pair name**: `tms-vm-key`.
6. **Inbound Port Rules**:
   * **Public inbound ports**: Select `Allow selected ports`.
   * **Select inbound ports**: Check `SSH (22)`, `HTTP (80)`, and `HTTPS (443)`.
7. Click **Review + create**, then **Create**. Download the private key `.pem` file when prompted.

### Step 2: Install Docker and Docker Compose on Azure VM
Connect to your Azure VM via SSH:
```bash
ssh -i "tms-vm-key.pem" azureuser@YOUR_VM_PUBLIC_IP
```

Run the following commands on the server to install Docker:
```bash
# Update local packages
sudo apt-get update -y && sudo apt-get upgrade -y

# Install Docker dependencies
sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release git

# Add Docker’s official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up the stable repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine & Compose
sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Enable and start Docker service
sudo systemctl enable docker
sudo systemctl start docker

# Add azureuser to docker group
sudo usermod -aG docker azureuser
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

## 3. Infrastructure Setup (Architecture B: Azure Managed Services)

If deploying the scalable serverless architecture, follow these steps to provision resources:

### Step 1: Azure Database for PostgreSQL (Flexible Server)
1. Go to **Azure Database for PostgreSQL servers** -> Click **Create**.
2. Select **Flexible Server**.
3. **Settings**:
   * **Server Name**: `tms-prod-db` (must be unique).
   * **Compute + storage**: Select `Burstable, B1ms` (Free-tier friendly).
   * **Admin Username**: `postgres`
   * **Admin Password**: Enter a strong password.
4. **Networking**:
   * **Connectivity method**: `Public access (allowed IP addresses)` or `Private access (VNet Integration)`.
   * If using Public Access, you must check **Allow public access from any Azure service within Azure to this server** to enable Azure Container Apps to reach the database.
   * Add firewall rules to restrict access only to specific IPs if required.

### Step 2: Azure Container Registry (ACR)
1. Go to **Container registries** -> Click **Create**.
2. **Registry Name**: `tmsregistry` (must be alphanumeric and unique).
3. **SKU**: `Basic`.
4. Click **Review + Create**.
5. Once created, go to the registry's **Access keys** menu and enable the **Admin user**. Copy the **Username** and **Password** for your CI/CD secrets.

### Step 3: Azure Container Apps (ACA) for Backend
1. Go to **Container Apps** -> Click **Create**.
2. **App Name**: `tms-backend`.
3. **Container App Environment**: Create a new environment `tms-prod-env`.
4. **Container Settings**:
   * Uncheck *Use quickstart image*.
   * Set Image source to **Azure Container Registry**.
   * Select your ACR, the repository (`tms-backend`), and select `latest`.
5. **Ingress Settings**:
   * Enable Ingress.
   * **Target Port**: `3000`.
   * **Ingress Traffic**: `Accepting traffic from anywhere` (public).
   * **Transport**: Select `Auto` or `HTTP/1.1`.
6. Go to **Configuration** -> **Containers** -> **Environment variables** to configure production environment secrets (`DATABASE_URL`, `JWT_SECRET`, etc.).

### Step 4: Azure Static Web Apps (ASWA) for Frontend
Azure Static Web Apps is the easiest and most powerful service for Vite React apps:
1. Go to **Static Web Apps** -> Click **Create**.
2. **Name**: `tms-frontend`.
3. **Hosting Plan**: `Free` (includes free SSL and custom domain).
4. **Deployment details**: Select **GitHub** and authorize.
5. Choose your repository and the target branch (`main`).
6. **Build Presets**:
   * Select `Vite`.
   * **App location**: `/frontend`
   * **Api location**: Leave empty.
   * **Output location**: `dist`
7. Click **Review + Create**. Azure will automatically register a workflow in your GitHub repository to compile and deploy your code.

---

## 4. CI/CD Secrets Configuration

To run the automated deployment pipeline, add the following secrets to your GitHub repository under **Settings** -> **Secrets and variables** -> **Actions** -> **Repository Secrets**:

| Secret Key | Architecture | Description / Value |
| :--- | :--- | :--- |
| `AZURE_CREDENTIALS` | B (ACA) | Azure Service Principal JSON credential (allows GitHub to authenticate with your Azure account). |
| `AZURE_ACR_USERNAME` | B (ACA) | The Admin username of your Azure Container Registry. |
| `AZURE_ACR_PASSWORD` | B (ACA) | The Admin password of your Azure Container Registry. |
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | B (SWA) | Deployment API token from the Azure Static Web App portal. |
| `VITE_API_URL_PROD` | B (ACA) | The HTTPS URL of your Azure Container App backend (e.g. `https://tms-backend.agreeable-wave.azurecontainerapps.io`). |
| `VITE_SOCKET_URL_PROD`| B (ACA) | The HTTPS URL of your Azure Container App backend. |
| `AZURE_VM_HOST` | A (VM) | Public IP address of the Azure Linux VM. |
| `AZURE_VM_SSH_KEY` | A (VM) | The private key (`.pem`) used to SSH into the Azure VM. |
| `BACKEND_ENV` | A (VM) | Complete text content of the production `.env` file for the backend. |
| `FRONTEND_ENV` | A (VM) | Complete text content of the production `.env` file for the frontend. |

### How to generate `AZURE_CREDENTIALS` Service Principal JSON:
Install the Azure CLI locally and run:
```bash
az login
az ad sp create-for-rbac --name "github-actions-deploy-sp" --role contributor \
  --scopes /subscriptions/YOUR_SUBSCRIPTION_ID/resourceGroups/tms-prod-rg \
  --sdk-auth
```
Copy the JSON block output and save it as `AZURE_CREDENTIALS` in GitHub Secrets.

---

## 5. WebSockets & CORS Setup on Azure Container Apps

Azure Container Apps supports WebSockets out of the box, but you must ensure session affinity is configured if running multiple instances:

1. **Sticky Sessions (Session Affinity)**:
   * Navigate to your **Azure Container App** in the Azure Portal.
   * Go to **Ingress** under Settings.
   * Under Ingress settings, check the **Session Affinity** setting (set to `Single` or `Enabled`). This ensures client socket upgrades reach the same container instance.
2. **CORS Configuration**:
   * Set `CLIENT_ORIGIN` in backend environment variables to include the Static Web App domain name (e.g., `https://white-sea-12345.azurestaticapps.net`).

---

## 6. DB Migration & Seed Procedures

* **Azure VM Deployment (Architecture A)**:
  Migrations are automatically triggered after container startup via Docker Compose:
  `command: sh -c "npx prisma migrate deploy && npx prisma db seed && npm run start"`
* **Azure Container Apps Deployment (Architecture B)**:
  Instead of running migrations inside scaling API containers, you can run migrations as a one-time job using **Azure Container Apps Jobs**:
  1. Create a Container App Job using your ACR backend image.
  2. Set the start command to: `npx prisma migrate deploy`.
  3. Run the job before deploying the container app update.

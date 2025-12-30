![AWS](https://img.shields.io/badge/AWS-Cloud-orange?style=for-the-badge&logo=amazon-aws)
![Architecture](https://img.shields.io/badge/Architecture-3--Tier-blue?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Production-brightgreen?style=for-the-badge)

A highly available, scalable 3-tier web application infrastructure deployed on AWS with automated scaling, load balancing, and managed database services.

## 📐 Architecture


<img width="1378" height="1457" alt="Origin" src="https://github.com/user-attachments/assets/1212b62c-5b22-40dc-a03b-da990d279caa" />


### Architecture Components

- **Presentation Tier**: Auto-scaled web servers (Nginx + React) behind Application Load Balancer
- **Application Tier**: Auto-scaled app servers (Node.js) behind Internal Load Balancer  
- **Data Tier**: Multi-AZ RDS MySQL database in private subnets
- **Networking**: VPC with public/private subnets across 2 Availability Zones
- **Security**: Multi-layered security groups, private subnets, Session Manager access

---

## 🚀 Quick Start

### Prerequisites

- AWS Account with appropriate IAM permissions
- AWS CLI configured (optional)
- Application code ready in S3 or GitHub

### Infrastructure Components

| Component | Configuration | Count |
|-----------|---------------|-------|
| VPC | 192.168.0.0/16 | 1 |
| Public Subnets | /20 | 2 |
| Private Subnets | /20 | 4 |
| Availability Zones | ap-south-1a, ap-south-1b | 2 |
| NAT Gateways | For private subnet internet access | 1 |
| Application Load Balancers | External + Internal | 2 |
| Auto Scaling Groups | Web + App tiers | 2 |
| RDS MySQL | Multi-AZ, db.t3.micro | 1 |
| Security Groups | Layered security | 5 |

---

## 📋 Deployment Steps

### Step 1: Create VPC

**AWS Console** → **VPC** → **Create VPC** → **VPC and more**

<img width="1259" height="704" alt="Screenshot 2025-11-09 151518" src="https://github.com/user-attachments/assets/74221b76-89d8-431d-aa60-9a499c33a632" />

```yaml
Name: AquaInfra
IPv4 CIDR: 192.168.0.0/16
Number of AZs: 2
Public subnets: 2
Private subnets: 4
NAT Gateways: In 1 AZ
VPC endpoints: S3 Gateway
DNS hostnames: Enabled
DNS resolution: Enabled
```

<img width="1449" height="406" alt="VPC arch" src="https://github.com/user-attachments/assets/2966908c-4a53-49da-97d0-df536ccbee80" />


---

### Step 2: Create Security Groups

Create 5 security groups for different tiers:

#### 1. Web-SG (Web Tier)


<img width="1680" height="649" alt="Screenshot 2025-11-09 151929" src="https://github.com/user-attachments/assets/898c9bbc-d850-4cd2-94bb-e57f1b1c3d27" />

```
Name: Web-SG
VPC: AquaInfra-vpc

Inbound Rules:
- HTTP (80) from 0.0.0.0/0
- HTTPS (443) from 0.0.0.0/0
```

#### 2. App-SG (Application Tier)


<img width="1664" height="582" alt="Screenshot 2025-11-09 152105" src="https://github.com/user-attachments/assets/64f1a1a5-48f7-43c0-83a6-18564153db1b" />


```
Name: App-SG
VPC: AquaInfra-vpc

Inbound Rules:
- Custom TCP (4000) from Web-SG
- HTTP (80) from 0.0.0.0/0
- HTTPS (443) from 0.0.0.0/0
```

#### 3. database-SG (Database Tier)



<img width="1683" height="603" alt="Screenshot 2025-11-09 152137" src="https://github.com/user-attachments/assets/754b1071-eeff-44ad-9350-f1c330ec8d86" />


```
Name: database-SG
VPC: AquaInfra-vpc

Inbound Rules:
- MySQL/Aurora (3306) from App-SG
```

#### 4. Internal-ALB-SG

<img width="1677" height="657" alt="Screenshot 2025-11-09 152004" src="https://github.com/user-attachments/assets/936687e3-e809-4655-a95a-0795e9f271f7" />


```
Name: Internal-ALB-SG
VPC: AquaInfra-vpc

Inbound Rules:
- HTTP (80) from Web-SG
```

#### 5. External-ALB-SG
<img width="1706" height="693" alt="Screenshot 2025-11-09 151844" src="https://github.com/user-attachments/assets/1b8a4bc4-d473-4131-8936-f7ee4d84e81b" />


```
Name: External-ALB-SG
VPC: AquaInfra-vpc

Inbound Rules:
- HTTP (80) from 0.0.0.0/0
- HTTPS (443) from 0.0.0.0/0
```

<img width="1607" height="410" alt="SG" src="https://github.com/user-attachments/assets/c090445c-1dd9-481d-9f93-0ded3b886171" />


---

### Step 3: Create S3 Bucket


```
Bucket name: aquainfra-app-code
Region: ap-south-1
Block public access: Enabled
Encryption: SSE-S3
```

**Folder Structure:**

```
aquainfra-app-code/
└── application-code/
    ├── app-tier/
    │   ├── index.js
    │   ├── package.json
    │   └── DbConfig.js
    ├── web-tier/
    │   ├── src/
    │   ├── public/
    │   └── package.json
    └── nginx.conf
```



---

### Step 4: Create IAM Role

<img width="1357" height="195" alt="Screenshot 2025-11-09 152601" src="https://github.com/user-attachments/assets/a35fb35b-0b13-448a-801a-9b1b34ea9674" />

```
Role name: AquaInfra-EC2-Role
Trusted entity: EC2

Attached Policies:
- AmazonSSMManagedInstanceCore
- AmazonS3ReadOnlyAccess
```

---

### Step 5: Create RDS MySQL

#### Create DB Subnet Group

<img width="1354" height="215" alt="Screenshot 2025-11-09 152945" src="https://github.com/user-attachments/assets/abb246bf-7e09-4125-b969-33a8152a3a80" />


```
Name: aquainfra-db-subnet-group
VPC: AquaInfra-vpc
Subnets: Both private database subnets
```

#### Create Database

<img width="1703" height="400" alt="Screenshot 2025-11-09 153959" src="https://github.com/user-attachments/assets/60db5fcf-a493-4340-aeb4-1d00f468b78c" />


```yaml
Engine: MySQL 8.0
DB identifier: mydb
Master username: admin
Master password: [SecurePassword]
Instance class: db.t3.micro
Storage: 20 GB gp3
Multi-AZ: Enabled
VPC: AquaInfra-vpc
Subnet group: aquainfra-db-subnet-group
Security group: database-SG
Initial database: webappdb
```

<img width="1320" height="370" alt="Screenshot 2025-11-09 154034" src="https://github.com/user-attachments/assets/67da42d1-3487-42a1-aa30-2e7418d9269f" />


**Save the endpoint:** `mydb.xxxxxxxx.ap-south-1.rds.amazonaws.com`

---

### Step 6: App Tier  - Launch Template & Target Group

#### Create Launch Template

<img width="1073" height="573" alt="Screenshot 2025-11-09 155805" src="https://github.com/user-attachments/assets/28f5a95e-7dc7-4838-9070-09bc4fdd27ea" />


```
Name: App-tier and Web-tier
AMI: The AMI was created from a fully configured EC2 instance with the application already deployed and validated.
Instance type: t2.micro
Security group: App-SG
IAM role: AquaInfra-EC2-Role
```

#### Create Target Group

<img width="1376" height="283" alt="Screenshot 2025-11-09 160455" src="https://github.com/user-attachments/assets/7a1cd43b-02af-426e-a573-8b3de12d1b76" />



```
Name: App-TG
Protocol: HTTP
Port: 4000
VPC: AquaInfra-vpc
Health check path: /health
```

---

### Step 7: Create Internal Load Balancer

<img width="1688" height="280" alt="Screenshot 2025-11-09 162924" src="https://github.com/user-attachments/assets/e2724bca-29ce-47ac-b9cb-a8c0ef99f593" />


```
Name: App-ALB
Scheme: Internal
VPC: AquaInfra-vpc
Subnets: Both private app subnets
Security group: Internal-ALB-SG
Listener: HTTP:80 → App-TG
```

---

### Step 8: Web Tier - Launch Template & Target Group

#### Create Launch Template

<img width="1077" height="517" alt="Screenshot 2025-11-09 161427" src="https://github.com/user-attachments/assets/aa00a595-8d9a-43e1-96a8-2c5b0d1cbee6" />


```
Name: Web-tier-LT
AMI: The AMI was created from a fully configured EC2 instance with the application already deployed and validated.
Instance type: t2.micro
Security group: Web-SG
IAM role: AquaInfra-EC2-Role
```

#### Create Target Group

<img width="1394" height="290" alt="Screenshot 2025-11-09 162030" src="https://github.com/user-attachments/assets/d84aa68a-3a65-4c99-9b6e-fd11861cca08" />


```
Name: Web-TG
Protocol: HTTP
Port: 80
VPC: AquaInfra-vpc
Health check path: /
```

---

### Step 9: Create External Load Balancer

<img width="1688" height="280" alt="Screenshot 2025-11-09 162924" src="https://github.com/user-attachments/assets/7d3b8ff3-a3a7-4b4e-92c6-f47f4d1e1af7" />


```
Name: Web-ALB
Scheme: Internet-facing
VPC: AquaInfra-vpc
Subnets: Both public subnets
Security group: External-ALB-SG
Listener: HTTP:80 → Web-TG
```

**Copy DNS name:** `Web-ALB-xxxxx.ap-south-1.elb.amazonaws.com`

---

### Step 10: Create Auto Scaling Group - Web Tier

<img width="1641" height="247" alt="Screenshot 2025-11-09 163006" src="https://github.com/user-attachments/assets/45a5e8f1-6337-4743-b1ce-e9a5ca8ad1d6" />


```yaml
Name: Web-ASG
Launch template: Web-tier-LT
VPC: AquaInfra-vpc
Subnets: Both public subnets
Target group: Web-TG
Health checks: ELB
Desired capacity: 2
Minimum: 2
Maximum: 4
Scaling policy: Target tracking - CPU 50%
Tag: Name = Web-Server
```

---

### Step 11: Create Auto Scaling Group - App Tier

<img width="1641" height="247" alt="Screenshot 2025-11-09 163006" src="https://github.com/user-attachments/assets/37da7010-dfbb-4126-971b-0a791d5714ff" />


```yaml
Name: App-ASG
Launch template: App-tier-LT
VPC: AquaInfra-vpc
Subnets: Both private app subnets
Target group: App-TG
Health checks: ELB
Desired capacity: 2
Minimum: 2
Maximum: 4
Scaling policy: Target tracking - CPU 50%
Tag: Name = App-Server
```

<img width="1672" height="316" alt="Screenshot 2025-11-09 162847" src="https://github.com/user-attachments/assets/37079cf0-43c3-468b-87fb-061e077d3893" />


---

## 🔧 Application Deployment

### Deploy Application Tier

Connect via **Session Manager**:

<img width="1674" height="404" alt="Screenshot 2025-11-09 154312" src="https://github.com/user-attachments/assets/e8f19129-8010-490e-9df2-c5065aee825f" />


```bash
# Install Node.js
sudo dnf install -y mariadb105
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 16
nvm use 16
npm install -g pm2

# Download application code
aws s3 cp s3://aquainfra-app-code/application-code/app-tier/ app-tier --recursive
cd app-tier

# Configure database connection
vi DbConfig.js
```

**DbConfig.js:**
```javascript
const config = {
  host: 'mydb.xxxxxxxx.ap-south-1.rds.amazonaws.com',
  user: 'admin',
  password: 'your-password',
  database: 'webappdb',
  port: 3306
};
module.exports = config;
```

```bash
# Install dependencies and start
npm install
pm2 start index.js
pm2 startup
pm2 save

# Verify
curl http://localhost:4000/health
pm2 status
```

<img width="1377" height="227" alt="Pm2" src="https://github.com/user-attachments/assets/f1a650c9-1434-4937-b038-682da025820d" />


---

### Deploy Web Tier

Connect via **Session Manager**:

```bash
# Install Node.js
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 16
nvm use 16

# Download web code
aws s3 cp s3://aquainfra-app-code/application-code/web-tier/ web-tier --recursive
cd web-tier

# Update API endpoint
vi src/App.js
# Update API_URL to App-ALB DNS

# Build application
npm install
npm run build

# Install and configure Nginx
sudo dnf install -y nginx
cd /etc/nginx
sudo aws s3 cp s3://aquainfra-app-code/application-code/nginx.conf .

# Update nginx.conf with App-ALB DNS
sudo vi nginx.conf

# Set permissions and start
sudo chmod -R 755 /home/ec2-user/
sudo systemctl start nginx
sudo systemctl enable nginx
sudo systemctl status nginx
```

**nginx.conf:**
```nginx
server {
    listen 80;
    server_name _;
    
    location / {
        root /home/ec2-user/web-tier/build;
        index index.html;
        try_files $uri /index.html;
    }
    
    location /api/ {
        proxy_pass http://App-ALB-internal-xxxxx.ap-south-1.elb.amazonaws.com;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

<img width="1394" height="380" alt="image" src="https://github.com/user-attachments/assets/5eb39df8-6fd4-4ff7-b63f-1b1b46150454" />


---

## ✅ Testing & Validation

### 1. Database Connection Test

```bash
mysql -h mydb.xxxxxxxx.ap-south-1.rds.amazonaws.com -u admin -p
```

<img width="1060" height="361" alt="image" src="https://github.com/user-attachments/assets/e9263818-a93b-4521-a72b-d73027af7e66" />


### 2. Application Health Check

```bash
curl http://localhost:4000/health
pm2 status
```

<img width="766" height="201" alt="image" src="https://github.com/user-attachments/assets/6c76be50-1bef-4a1b-99f6-d7c7a5a4a2c6" />



### 3. End-to-End Test

Access application: `http://Web-ALB-xxxxx.ap-south-1.elb.amazonaws.com`

<img width="1441" height="415" alt="image" src="https://github.com/user-attachments/assets/a0e2cbd3-55e2-4671-a766-d8ae62350c21" />


---

## 📊 Infrastructure Summary

| Component | Details | Status |
|-----------|---------|--------|
| **VPC** | 192.168.0.0/16, 2 AZs | ✅ |
| **Subnets** | 2 Public + 4 Private | ✅ |
| **Security Groups** | 5 Groups (layered security) | ✅ |
| **S3 Bucket** | Private bucket for code | ✅ |
| **IAM Role** | EC2 with SSM + S3 access | ✅ |
| **RDS MySQL** | Multi-AZ, 20GB | ✅ |
| **Internal ALB** | For app tier | ✅ |
| **External ALB** | For web tier | ✅ |
| **Web ASG** | 2-4 instances | ✅ |
| **App ASG** | 2-4 instances | ✅ |

---

## 🛠️ Technologies Used

- **Cloud Provider**: AWS
- **Compute**: EC2 Auto Scaling Groups
- **Load Balancing**: Application Load Balancers
- **Database**: RDS MySQL (Multi-AZ)
- **Networking**: VPC, Subnets, NAT Gateway, Internet Gateway
- **Storage**: S3
- **Security**: Security Groups, IAM Roles, Session Manager
- **Frontend**: React.js, Nginx
- **Backend**: Node.js, Express
- **Process Manager**: PM2
- **Region**: ap-south-1 (Mumbai)

---

## 📁 Repository Structure

```
.
├── README.md
├── architecture-diagram.png
├── screenshots/
│   ├── vpc-configuration.png
│   ├── security-groups.png
│   ├── rds-endpoint.png
│   └── ...
├── application-code/
│   ├── app-tier/
│   │   ├── index.js
│   │   ├── package.json
│   │   └── DbConfig.js
│   ├── web-tier/
│   │   ├── src/
│   │   ├── public/
│   │   └── package.json
│   └── nginx.conf
└── scripts/
    └── cleanup.sh
```

---











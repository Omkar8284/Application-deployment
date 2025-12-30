# 3-Tier Web Application Deployment on AWS

![AWS](https://img.shields.io/badge/AWS-Cloud-orange?style=for-the-badge&logo=amazon-aws)
![Architecture](https://img.shields.io/badge/Architecture-3--Tier-blue?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Production-brightgreen?style=for-the-badge)

A highly available, scalable 3-tier web application infrastructure deployed on AWS with automated scaling, load balancing, and managed database services.

## 📐 Architecture

![3-Tier Architecture]

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

![VPC Configuration] <img width="1259" height="704" alt="Screenshot 2025-11-09 151518" src="https://github.com/user-attachments/assets/74221b76-89d8-431d-aa60-9a499c33a632" />

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

![VPC Resource Map](<img width="1449" height="406" alt="VPC arch" src="https://github.com/user-attachments/assets/ff9a98e3-e35c-4a81-a025-c06d0eba51e5" />
)

---

### Step 2: Create Security Groups

Create 5 security groups for different tiers:

#### 1. Web-SG (Web Tier)

![Web Security Group](screenshots/web-sg.png)

```
Name: Web-SG
VPC: AquaInfra-vpc

Inbound Rules:
- HTTP (80) from 0.0.0.0/0
- HTTPS (443) from 0.0.0.0/0
```

#### 2. App-SG (Application Tier)

![App Security Group](screenshots/app-sg.png)

```
Name: App-SG
VPC: AquaInfra-vpc

Inbound Rules:
- Custom TCP (4000) from Web-SG
- HTTP (80) from 0.0.0.0/0
- HTTPS (443) from 0.0.0.0/0
```

#### 3. database-SG (Database Tier)

![Database Security Group](screenshots/database-sg.png)

```
Name: database-SG
VPC: AquaInfra-vpc

Inbound Rules:
- MySQL/Aurora (3306) from App-SG
```

#### 4. Internal-ALB-SG

![Internal ALB Security Group](screenshots/internal-alb-sg.png)

```
Name: Internal-ALB-SG
VPC: AquaInfra-vpc

Inbound Rules:
- HTTP (80) from Web-SG
```

#### 5. External-ALB-SG

![External ALB Security Group](screenshots/external-alb-sg.png)

```
Name: External-ALB-SG
VPC: AquaInfra-vpc

Inbound Rules:
- HTTP (80) from 0.0.0.0/0
- HTTPS (443) from 0.0.0.0/0
```

![All Security Groups](screenshots/all-security-groups.png)

---

### Step 3: Create S3 Bucket

![S3 Bucket](screenshots/s3-bucket.png)

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

![S3 Folder Structure](screenshots/s3-folders.png)

---

### Step 4: Create IAM Role

![IAM Role](screenshots/iam-role.png)

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

![DB Subnet Group](screenshots/db-subnet-group.png)

```
Name: aquainfra-db-subnet-group
VPC: AquaInfra-vpc
Subnets: Both private database subnets
```

#### Create Database

![RDS Configuration](screenshots/rds-configuration.png)

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

![RDS Endpoint](screenshots/rds-endpoint.png)

**Save the endpoint:** `mydb.xxxxxxxx.ap-south-1.rds.amazonaws.com`

---

### Step 6: App Tier - Launch Template & Target Group

#### Create Launch Template

![App Launch Template](screenshots/app-launch-template.png)

```
Name: App-tier-LT
AMI: Amazon Linux 2023
Instance type: t2.micro
Security group: App-SG
IAM role: AquaInfra-EC2-Role
```

#### Create Target Group

![App Target Group](screenshots/app-target-group.png)

```
Name: App-TG
Protocol: HTTP
Port: 4000
VPC: AquaInfra-vpc
Health check path: /health
```

---

### Step 7: Create Internal Load Balancer

![Internal ALB](screenshots/internal-alb.png)

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

![Web Launch Template](screenshots/web-launch-template.png)

```
Name: Web-tier-LT
AMI: Amazon Linux 2023
Instance type: t2.micro
Security group: Web-SG
IAM role: AquaInfra-EC2-Role
```

#### Create Target Group

![Web Target Group](screenshots/web-target-group.png)

```
Name: Web-TG
Protocol: HTTP
Port: 80
VPC: AquaInfra-vpc
Health check path: /
```

---

### Step 9: Create External Load Balancer

![External ALB](screenshots/external-alb.png)

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

![Web ASG](screenshots/web-asg.png)

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

![App ASG](screenshots/app-asg.png)

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

![App ASG Running](screenshots/app-asg-running.png)

---

## 🔧 Application Deployment

### Deploy Application Tier

Connect via **Session Manager**:

![Session Manager](screenshots/session-manager.png)

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

![PM2 Status](screenshots/pm2-status.png)

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

![Nginx Status](screenshots/nginx-status.png)

---

## ✅ Testing & Validation

### 1. Database Connection Test

```bash
mysql -h mydb.xxxxxxxx.ap-south-1.rds.amazonaws.com -u admin -p
```

![MySQL Connected](screenshots/mysql-connected.png)

### 2. Application Health Check

```bash
curl http://localhost:4000/health
pm2 status
```

![App Health](screenshots/app-health.png)

### 3. Target Group Health

Check both target groups are healthy:

![App TG Healthy](screenshots/app-tg-healthy.png)
![Web TG Healthy](screenshots/web-tg-healthy.png)

### 4. End-to-End Test

Access application: `http://Web-ALB-xxxxx.ap-south-1.elb.amazonaws.com`

![Application Working](screenshots/app-working.png)

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

## 🧹 Cleanup

To delete all resources and avoid charges:

```bash
# 1. Set ASG desired capacity to 0
aws autoscaling update-auto-scaling-group --auto-scaling-group-name Web-ASG --desired-capacity 0
aws autoscaling update-auto-scaling-group --auto-scaling-group-name App-ASG --desired-capacity 0

# Wait 2-3 minutes for instances to terminate

# 2. Delete Auto Scaling Groups
aws autoscaling delete-auto-scaling-group --auto-scaling-group-name Web-ASG --force-delete
aws autoscaling delete-auto-scaling-group --auto-scaling-group-name App-ASG --force-delete

# 3. Delete Load Balancers
# Via AWS Console: EC2 → Load Balancers → Delete Web-ALB and App-ALB

# 4. Delete Target Groups
# Via AWS Console: EC2 → Target Groups → Delete Web-TG and App-TG

# 5. Delete RDS Database
# Via AWS Console: RDS → Databases → Delete mydb (uncheck final snapshot)

# 6. Delete Launch Templates, Security Groups, NAT Gateway, VPC
# Via AWS Console in order
```

**Or use AWS Console:**
1. Auto Scaling Groups (set capacity to 0, then delete)
2. Load Balancers
3. Target Groups  
4. RDS Database
5. Launch Templates
6. Security Groups
7. NAT Gateway (wait 5 min, release EIP)
8. VPC (auto-deletes subnets, IGW, route tables)
9. S3 Bucket (empty first)
10. IAM Role

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

## 🔐 Security Features

- ✅ Multi-layered security groups
- ✅ Database in private subnets (no internet access)
- ✅ Session Manager (no SSH keys required)
- ✅ IAM roles (no hardcoded credentials)
- ✅ S3 bucket encryption
- ✅ RDS encryption at rest
- ✅ Private subnets for app and database tiers
- ✅ Security group rules follow least privilege

---

## 🚀 Scalability Features

- ✅ Auto Scaling based on CPU utilization
- ✅ Multi-AZ deployment for high availability
- ✅ Load balancers distribute traffic
- ✅ RDS Multi-AZ for database failover
- ✅ Horizontal scaling (2-4 instances per tier)
- ✅ Independent scaling per tier

---

## 📈 Monitoring

- **EC2 Metrics**: CPU, Network, Disk I/O
- **ALB Metrics**: Request count, latency, HTTP responses
- **RDS Metrics**: CPU, connections, storage, IOPS
- **Target Health**: ALB health checks
- **ASG Activity**: Scaling events and instance launches

---

## 🤝 Contributing

Feel free to fork this repository and submit pull requests for improvements.

---

## 📄 License

This project is open source and available under the MIT License.

---

## 👤 Author

**Omkar Kale**

- GitHub: [@Omkar8284](https://github.com/Omkar8284)
- LinkedIn: [Connect with me](https://linkedin.com/in/your-profile)

---

## 📞 Support

For questions or issues, please open an issue in this repository.

---

## ⭐ Show Your Support

Give a ⭐️ if this project helped you!

---

**Built with ❤️ on AWS**



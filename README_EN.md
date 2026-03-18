# ALLinSSL - Complete SSL Certificate Management Tool

## Project Introduction

ALLinSSL is a comprehensive SSL certificate lifecycle management tool that integrates certificate application, management, deployment, and monitoring. This tool helps users easily manage SSL certificates for multiple websites, providing automated certificate application, renewal, and deployment processes, while monitoring certificate status in real-time to ensure website security.

## Main Features

- **Certificate Application**: Support automatic free certificate applications from Let's Encrypt and other CAs using the ACME protocol
- **Certificate Management**: Centralized management of all SSL certificates, including manually uploaded and automatically applied certificates
- **Certificate Deployment**: Support one-click deployment to multiple platforms such as Alibaba Cloud, Tencent Cloud, BaoTa Panel, 1Panel, etc.
- **Site Monitoring**: Real-time monitoring of SSL certificate status, early warning of certificate expiration
- **Automated Tasks**: Support scheduled tasks, automatic certificate renewal and deployment
- **Multi-platform Support**: Support multiple DNS providers (Alibaba Cloud, Tencent Cloud, etc.) for DNS verification

## Technology Stack

- **Backend**: Go (Gin Framework)
- **Frontend**: Vue 3 + Vite + Turbo Monorepo
- **Data Storage**: SQLite
- **Certificate Management**: ACME Protocol (Let's Encrypt)
- **Scheduled Tasks**: Built-in scheduler

## Installation Guide

### System Requirements

- Operating System: Linux / macOS / Windows
- Docker (optional)

### Installation Methods

#### Method 1: Quick Install (Linux)
```bash
curl -sSO http://allinssl.bt.cn/install_allinssl.sh && bash install_allinssl.sh allinssl
```

#### Method 2: Docker Install
```bash
docker run -itd \
  --name allinssl \
  -p 8888:8888 \
  -v /www/allinssl/data:/www/allinssl/data \
  -e ALLINSSL_USER=allinssl \
  -e ALLINSSL_PWD=allinssldocker \
  -e ALLINSSL_URL=allinssl \
  -e TZ=Asia/Shanghai \
  allinssl/allinssl:latest
```

#### Method 3: Binary Install
1. Download the latest release from [GitHub Releases](https://github.com/allinssl/allinssl/releases)
2. Extract the archive
3. Get login credentials:
   - Linux: `./allinssl 15` (address), `./allinssl 6` (password)
   - Windows: `.\allinssl 15` (address), `.\allinssl 6` (password)
4. Run the service:
   - Linux: `./allinssl start`
   - Windows: `.\allinssl start`

#### Method 4: Build from Source (Recommended for Development)

##### Option A: Using Build Script (Recommended)

**Linux/macOS:**
```bash
git clone https://github.com/allinssl/allinssl.git
cd allinssl
chmod +x build.sh
./build.sh
```

**Windows:**
```batch
git clone https://github.com/allinssl/allinssl.git
cd allinssl
build.bat
```

##### Option B: Manual Build

**Prerequisites:**
- Go 1.23+
- Node.js 18+
- pnpm 8+

```bash
# 1. Clone the project
git clone https://github.com/allinssl/allinssl.git
cd allinssl

# 2. Build frontend
cd frontend
pnpm install
pnpm run build
cd ..

# 3. Build backend
go mod tidy
go build -o allinssl cmd/main.go

# 4. Run
./allinssl start
```

##### Option C: Docker Build

```bash
docker build -t allinssl:latest .
```

### Development Mode

#### Frontend Development Mode
```bash
cd frontend
pnpm run dev
# Access http://localhost:5173
# Configure proxy to point to backend port
```

#### Backend Development Mode
```bash
go run cmd/main.go start
# Access http://localhost:8888
```

### First-time Setup

1. After first startup, access `http://your-ip:your-port/secure-entry`
2. Set up administrator account and password
3. Set the secure entry path and port number
4. Add DNS provider and hosting provider credentials
5. Create workflow for automated certificate management

## User Guide

### Automated Deployment

#### Certificate Application
1. Add DNS verification credentials (supporting Alibaba Cloud, Tencent Cloud, etc.)
2. Enter the domain names for which certificates are needed
3. Enter email address (for receiving CA notifications)

#### Certificate Upload
1. Select manual certificate upload
2. Paste certificate and private key content

#### Certificate Deployment

1. Select applied or uploaded certificates
2. Choose deployment targets (supports Alibaba Cloud CDN, Tencent Cloud CDN, BaoTa Panel, 1Panel, etc.)
3. Add deployment credentials (such as API keys for Alibaba Cloud, Tencent Cloud)

#### Notifications
1. Configure notification channels
2. Enter notification content and subject


### Site Monitoring

1. Add domain names to monitor
2. The system will automatically detect the certificate status
3. Set certificate expiration reminder threshold (default is 30 days)
4. When the certificate is approaching expiration, the system will send reminders
5. When multiple consecutive website anomalies are detected, the system will send alerts


## Command Line Operations

```bash
# Basic Operations
allinssl 1: Start service
allinssl 2: Stop service
allinssl 3: Restart service
allinssl 4: Modify secure entry
allinssl 5: Modify username
allinssl 6: Modify password
allinssl 7: Modify port

# Web Service Management
allinssl 8: Disable web service
allinssl 9: Enable web service
allinssl 10: Restart web service

# Background Task Management
allinssl 11: Disable background scheduler
allinssl 12: Enable background scheduler
allinssl 13: Restart background scheduler

# System Management
allinssl 14: Disable HTTPS
allinssl 15: Get panel address
allinssl 16: Update ALLinSSL to the latest version (file overwrite installation)
allinssl 17: Uninstall ALLinSSL
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Layer                          │
│  Vue 3 + Naive UI + Vite + Turbo Monorepo                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Backend Layer                          │
│  Gin Framework + RESTful API + Session Management           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Core Services                           │
│  Certificate Service │ Deployment Service │ Workflow Engine │
│  Monitor Scheduler   │ Notification Service                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Data Storage Layer                        │
│  SQLite Database │ File Storage                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  External Integrations                      │
│  ACME Protocol │ Cloud Provider APIs │ DNS Providers        │
└─────────────────────────────────────────────────────────────┘
```

## License

This project is licensed under the terms specified in the [LICENSE](./LICENSE) file.

## Contributing

We welcome contributions! Please feel free to:
1. Submit issues to report problems
2. Create pull requests to improve code
3. Improve project documentation
4. Share use cases

## Contact Us

- Email: support@allinssl.com
- Issues: [GitHub Issues](https://github.com/allinssl/allinssl/issues)

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

- **Backend**: Go language
- **Frontend**: HTML/CSS/JavaScript
- **Data Storage**: SQLite
- **Certificate Management**: ACME Protocol (Let's Encrypt)
- **Scheduled Tasks**: Built-in scheduler.

## Installation Guide

### System Requirements

- Operating System: Linux
- Permission Requirements: Read and write permissions to create data directories

### Installation Steps
#### 1. Install via official installation script
#### 2. Compile and install:
  - When compiling and installing, pay attention to the name and path of the executable file. In `allinssl.sh`, you need to modify the corresponding name and path, otherwise the script may not work
  - Recommended installation path is `/www/allinssl/`, executable file name should be `allinssl`, and it's recommended to create a symbolic link of `allinssl.sh` to the `/usr/bin/` directory
  - Installation:
    1. Download the latest release package and extract it
    2. Compile the Go program (allinssl)
    3. Run the executable to start the service
       - Linux: Execute `./allinssl start`

### First-time Setup

1. After first startup, set up administrator account and password
2. Set the secure entry path and port number
3. After completing the initial setup, you can access the management interface via `http://your-ip:your-port/your-secure-entry`

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

## License

This project is licensed under the terms specified in the [LICENSE](./LICENSE) file.
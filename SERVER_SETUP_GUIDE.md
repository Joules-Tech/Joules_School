# CampusControl — Self-Hosted Ubuntu Server Master Guide

> Product: **CampusControl** (formerly Joules School) by **Joules Technologies**
> Domains: `campuscontrol.in` · `joulestechnologies.in` · SSH via `joules.fun`
> Server User: `campusadmin` (only one user throughout)

---

## Architecture Overview

```
Internet
    │
    ▼
[Cloudflare Edge]  ← SSL, DDoS protection, no static IP needed
    │
    │  (encrypted outbound tunnel — zero open inbound ports)
    ▼
[Ubuntu Server]
├── cloudflared     (tunnel agent)
├── Docker
│   ├── PostgreSQL      (replaces Supabase)
│   ├── CampusControl   (replaces Vercel)
│   ├── Code-Server     (VS Code in browser)
│   └── [Future Apps...]
└── UFW Firewall    (only SSH port 2222 open)
```

**Labels used in this guide:**
- `[MAC]` — run on your MacBook terminal
- `[SERVER]` — run on the Ubuntu server terminal

---

## Pre-Setup: Clean Your MacBook SSH

Run these on your Mac before starting anything:

```bash
# [MAC] Remove all old SSH keys and known hosts
rm -rf ~/.ssh
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# [MAC] Remove cloudflared if previously installed
brew uninstall cloudflared 2>/dev/null
rm -rf ~/.cloudflared

# [MAC] Verify clean
ls ~/.ssh
# Should show empty output
```

---

## Phase 1: Ubuntu Server First Boot Setup

> You just installed Ubuntu 22.04 LTS. You are logged in as `campusadmin`.
> All commands in this phase run on the SERVER.

### 1.1 — Update Server

```bash
# [SERVER]
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget nano git ufw fail2ban unattended-upgrades
```

---

### 1.2 — Set Timezone & Hostname

```bash
# [SERVER]
sudo timedatectl set-timezone Asia/Kolkata
sudo hostnamectl set-hostname joules-campus

# Verify
timedatectl status
hostname
```

---

### 1.3 — Add Swap (Important for 4GB RAM servers)

```bash
# [SERVER]
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Verify
free -h
```

---

### 1.4 — Generate SSH Key ON THE SERVER

```bash
# [SERVER] — Generate key for campusadmin
ssh-keygen -t ed25519 -C "campusadmin@joules-campus" -f ~/.ssh/id_ed25519 -N ""

# View and COPY the public key — you will need it on your Mac
cat ~/.ssh/id_ed25519.pub
```

Copy the entire output (starts with `ssh-ed25519 ...`).

---

### 1.5 — Add Server's Public Key to Its Own authorized_keys

```bash
# [SERVER]
cat ~/.ssh/id_ed25519.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

---

### 1.6 — Harden SSH Config

```bash
# [SERVER]
sudo nano /etc/ssh/sshd_config
```

Find and change these lines (use Ctrl+W to search):

```
Port 2222
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3
```

```bash
# [SERVER] — Restart SSH (DO NOT close current terminal yet)
sudo systemctl restart ssh
```

> **Warning:** Keep your current terminal open. Open a NEW terminal to test SSH before closing.

---

### 1.7 — Test SSH from Mac (New Terminal Window)

First, generate your Mac's SSH key:

```bash
# [MAC] — New terminal window
ssh-keygen -t ed25519 -C "aryan@macbook" -f ~/.ssh/id_ed25519 -N ""

# View your Mac public key — copy this output
cat ~/.ssh/id_ed25519.pub
```

Now add your Mac's public key to the server. Go back to your SERVER terminal:

```bash
# [SERVER] — Paste your Mac's public key here
echo "PASTE_YOUR_MAC_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys
```

Now test from Mac:

```bash
# [MAC] — Test connection (use your server's current IP)
ssh -p 2222 campusadmin@YOUR_SERVER_IP
```

If it connects — success. Now you can close the old terminal.

---

### 1.8 — Mac SSH Shortcut Config

```bash
# [MAC]
nano ~/.ssh/config
```

Add this:

```
Host joules
    HostName YOUR_SERVER_IP
    User campusadmin
    Port 2222
    IdentityFile ~/.ssh/id_ed25519
```

```bash
# [MAC] — Set correct permissions
chmod 600 ~/.ssh/config

# Test shortcut
ssh joules
```

---

### 1.9 — Firewall Setup

```bash
# [SERVER]
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 2222/tcp
sudo ufw enable
sudo ufw status
```

---

## Phase 2: Cloudflare Tunnel Setup

> All commands in this phase run on the SERVER as campusadmin.

### 2.1 — Move Domains to Cloudflare DNS

1. Go to cloudflare.com → Sign in → Add Sites:
   - `campuscontrol.in`
   - `joulestechnologies.in`
   - `joules.fun`

2. Cloudflare scans and imports existing DNS records.

3. In your domain registrar, change nameservers to the ones Cloudflare gives you.

4. Wait 5–30 minutes for propagation.

---

### 2.2 — Install cloudflared on Server

```bash
# [SERVER]
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o cloudflared.deb
sudo dpkg -i cloudflared.deb
cloudflared --version
```

---

### 2.3 — Authenticate cloudflared

```bash
# [SERVER]
cloudflared tunnel login
```

- This prints a URL — copy and open it in your browser
- Log into Cloudflare
- Select **`joules.fun`** as the zone
- A `cert.pem` is saved to `~/.cloudflared/cert.pem`

---

### 2.4 — Create the Tunnel

```bash
# [SERVER]
cloudflared tunnel create joules-server
```

Output example:
```
Created tunnel joules-server with id: 37767119-6b36-4416-b722-fbbc3460cd6d
```

Note your Tunnel ID — replace `YOUR_TUNNEL_ID` below with it.

---

### 2.5 — Configure the Tunnel

```bash
# [SERVER]
sudo mkdir -p /etc/cloudflared
sudo nano /etc/cloudflared/config.yml
```

Paste this (replace `YOUR_TUNNEL_ID` with your actual ID):

```yaml
tunnel: 95c1191a-440e-4b9f-9cef-fb8950c4fd07
credentials-file: /etc/cloudflared/95c1191a-440e-4b9f-9cef-fb8950c4fd07.json

ingress:
  # CampusControl main app
  - hostname: campuscontrol.in
    service: http://localhost:3000

  - hostname: www.campuscontrol.in
    service: http://localhost:3000

  # Status monitor
  - hostname: status.campuscontrol.in
    service: http://localhost:3001

  # VS Code browser editor
  - hostname: code.joules.fun
    service: http://localhost:8080

  # pgAdmin database UI
  - hostname: db.joules.fun
    service: http://localhost:5050

  # SSH via tunnel
  - hostname: ssh.joules.fun
    service: ssh://localhost:2222

  # Joules Technologies company site
  - hostname: joulestechnologies.in
    service: http://localhost:4000

  # Catch-all
  - service: http_status:404
```

---

### 2.6 — Copy Credentials to System Path

```bash
# [SERVER] — Copy credentials file so root/service can access it
sudo cp ~/.cloudflared/95c1191a-440e-4b9f-9cef-fb8950c4fd07.json /etc/cloudflared/
sudo cp ~/.cloudflared/cert.pem /etc/cloudflared/
```

---

### 2.7 — Add DNS Records

#### For `joules.fun` subdomains — use CLI:

```bash
# [SERVER] — These work via CLI because you authenticated with joules.fun
cloudflared tunnel route dns joules-server code.joules.fun
cloudflared tunnel route dns joules-server db.joules.fun
cloudflared tunnel route dns joules-server ssh.joules.fun
```

#### For `campuscontrol.in` — use Cloudflare Dashboard manually:

Go to **Cloudflare Dashboard → `campuscontrol.in` → DNS → Add record**:

| Type | Name | Target | Proxy |
|------|------|--------|-------|
| CNAME | `@` | `95c1191a-440e-4b9f-9cef-fb8950c4fd07.cfargotunnel.com` | ON |
| CNAME | `www` | `95c1191a-440e-4b9f-9cef-fb8950c4fd07.cfargotunnel.com` | ON |
| CNAME | `status` | `95c1191a-440e-4b9f-9cef-fb8950c4fd07.cfargotunnel.com` | ON |

#### For `joulestechnologies.in` — use Cloudflare Dashboard manually:

Go to **Cloudflare Dashboard → `joulestechnologies.in` → DNS → Add record**:

| Type | Name | Target | Proxy |
|------|------|--------|-------|
| CNAME | `@` | `95c1191a-440e-4b9f-9cef-fb8950c4fd07.cfargotunnel.com` | ON |
| CNAME | `www` | `95c1191a-440e-4b9f-9cef-fb8950c4fd07.cfargotunnel.com` | ON |

> **Rule:** Never run `cloudflared tunnel route dns` for `campuscontrol.in` or `joulestechnologies.in` — it will create wrong records. Always use the dashboard for those two domains.

---

### 2.8 — Install Tunnel as System Service

```bash
# [SERVER]
sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared

# Check status — should show active (running)
sudo systemctl status cloudflared
```

---

### 2.9 — SSH via Domain on Mac (Wireless SSH)

Install cloudflared on Mac:

```bash
# [MAC]
brew install cloudflared
```

Update your Mac SSH config:

```bash
# [MAC]
nano ~/.ssh/config
```

Replace or update the `joules` entry:

```
Host joules
    HostName ssh.joules.fun
    User campusadmin
    Port 2222
    IdentityFile ~/.ssh/id_ed25519
    ProxyCommand cloudflared access ssh --hostname %h
```

Test it:

```bash
# [MAC] — Now works from any network, no static IP needed
ssh joules
```

---

## Phase 3: Install Docker

```bash
# [SERVER]
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add campusadmin to docker group (no sudo needed for docker)
sudo usermod -aG docker campusadmin
newgrp docker

sudo apt install docker-compose-plugin -y

# Verify
docker --version
docker compose version
```

---

## Phase 4: Project Folder Structure

```bash
# [SERVER]
sudo mkdir -p /opt/campuscontrol
sudo mkdir -p /opt/joulestechnologies
sudo mkdir -p /opt/infrastructure
sudo chown -R campusadmin:campusadmin /opt/
```

```
/opt/
├── infrastructure/     ← PostgreSQL, pgAdmin, code-server, monitoring
├── campuscontrol/      ← CampusControl Next.js app
└── joulestechnologies/ ← Company website
```

---

## Phase 5: PostgreSQL Database (Replaces Supabase)

```bash
# [SERVER]
nano /opt/infrastructure/docker-compose.yml
```

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    container_name: shared_postgres
    restart: always
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "127.0.0.1:5432:5432"
    networks:
      - shared_network

  pgadmin:
    image: dpage/pgadmin4
    container_name: pgadmin
    restart: always
    environment:
      PGADMIN_DEFAULT_EMAIL: ${PGADMIN_EMAIL}
      PGADMIN_DEFAULT_PASSWORD: ${PGADMIN_PASSWORD}
    ports:
      - "127.0.0.1:5050:80"
    networks:
      - shared_network
    depends_on:
      - postgres

  code-server:
    image: codercom/code-server:latest
    container_name: code_server
    restart: always
    environment:
      PASSWORD: ${CODE_SERVER_PASSWORD}
    volumes:
      - /opt:/home/coder/projects
      - code_server_data:/home/coder/.local
    ports:
      - "127.0.0.1:8080:8080"
    networks:
      - shared_network

  uptime-kuma:
    image: louislam/uptime-kuma:1
    container_name: uptime_kuma
    restart: always
    volumes:
      - uptime_kuma_data:/app/data
    ports:
      - "127.0.0.1:3001:3001"
    networks:
      - shared_network

volumes:
  postgres_data:
  code_server_data:
  uptime_kuma_data:

networks:
  shared_network:
    name: shared_network
    driver: bridge
```

```bash
# [SERVER]
nano /opt/infrastructure/.env
```

```env
POSTGRES_USER=campusadmin
POSTGRES_PASSWORD=YourStrongPassword123!
PGADMIN_EMAIL=aryan@campuscontrol.in
PGADMIN_PASSWORD=AnotherStrongPassword!
CODE_SERVER_PASSWORD=YetAnotherPassword!
```

```bash
# [SERVER] — Start infrastructure
cd /opt/infrastructure
docker compose up -d

# Create databases
docker exec -it shared_postgres psql -U campusadmin -d postgres -c "CREATE DATABASE campuscontrol;"
docker exec -it shared_postgres psql -U campusadmin -d postgres -c "CREATE DATABASE joulestechnologies;"
```

---

## Phase 6: Deploy CampusControl App (Replaces Vercel)

```bash
# [SERVER]
cd /opt/campuscontrol
git clone https://github.com/Joules-Tech/Joules_School.git .
```

```bash
# [SERVER]
nano /opt/campuscontrol/docker-compose.yml
```

```yaml
version: '3.8'

services:
  campuscontrol:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: campuscontrol_app
    restart: always
    environment:
      DATABASE_URL: postgresql://campusadmin:${POSTGRES_PASSWORD}@shared_postgres:5432/campuscontrol
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      NEXTAUTH_URL: https://campuscontrol.in
      NODE_ENV: production
    networks:
      - shared_network
    ports:
      - "127.0.0.1:3000:3000"

networks:
  shared_network:
    external: true
    name: shared_network
```

**Dockerfile** (add to repo root if not present):

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

Add to `next.config.js`:
```js
const nextConfig = {
  output: 'standalone',
}
```

```bash
# [SERVER]
cd /opt/campuscontrol
docker compose up -d --build
```

---

## Phase 7: Security

### Fail2ban

```bash
# [SERVER]
sudo nano /etc/fail2ban/jail.local
```

```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = 2222
logpath = /var/log/auth.log
```

```bash
# [SERVER]
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### Cloudflare Zero Trust (Protect code-server and pgAdmin)

1. Cloudflare Dashboard → **Zero Trust** → **Access** → **Applications**
2. Add application → Self-hosted → Domain: `code.joules.fun`
3. Policy: Allow only your email
4. Auth: One-time PIN via email
5. Repeat for `db.joules.fun`

### Auto Security Updates

```bash
# [SERVER]
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

---

## Phase 8: Automated Database Backup

```bash
# [SERVER]
nano /opt/infrastructure/backup.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups"
mkdir -p $BACKUP_DIR

docker exec shared_postgres pg_dumpall -U campusadmin > "$BACKUP_DIR/full_backup_$DATE.sql"
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
echo "Backup completed: $DATE"
```

```bash
# [SERVER]
chmod +x /opt/infrastructure/backup.sh
crontab -e
# Add: 0 2 * * * /opt/infrastructure/backup.sh >> /var/log/db_backup.log 2>&1
```

---

## Phase 9: Auto-Deploy on Git Push

```bash
# [SERVER]
nano /opt/campuscontrol/deploy.sh
```

```bash
#!/bin/bash
set -e
echo "=== Deploying CampusControl ==="
cd /opt/campuscontrol
git pull origin main
docker compose build --no-cache
docker compose up -d
echo "=== Done ==="
```

```bash
# [SERVER]
chmod +x /opt/campuscontrol/deploy.sh
```

**GitHub Actions** — create `.github/workflows/deploy.yml` in your repo:

```yaml
name: Deploy to Server

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ssh.joules.fun
          username: campusadmin
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          port: 2222
          script: /opt/campuscontrol/deploy.sh
```

---

## Phase 10: Adding Future Apps

```bash
# [SERVER]
mkdir -p /opt/NEW_APP
git clone REPO_URL /opt/NEW_APP

# Pick unused port (4000, 5000, 6000...)
# Add to docker-compose.yml: ports: ["127.0.0.1:PORT:PORT"]

# Add to /etc/cloudflared/config.yml before the catch-all:
# - hostname: newapp.domain.com
#   service: http://localhost:PORT

# For joules.fun subdomains only — use CLI:
cloudflared tunnel route dns joules-server newapp.joules.fun

# For other domains — use Cloudflare Dashboard manually

sudo systemctl restart cloudflared

# Create database if needed
docker exec -it shared_postgres psql -U campusadmin -c "CREATE DATABASE new_app;"
```

---

## All Services & URLs

| Service | URL | Port | Purpose |
|---------|-----|------|---------|
| CampusControl | `https://campuscontrol.in` | 3000 | Main app |
| VS Code | `https://code.joules.fun` | 8080 | Remote coding |
| pgAdmin | `https://db.joules.fun` | 5050 | DB management |
| Status | `https://status.campuscontrol.in` | 3001 | Uptime monitor |
| SSH | `ssh joules` | 2222 | Server access |

---

## Setup Checklist

**Mac Prep**
- [ ] Old SSH keys removed from Mac
- [ ] Fresh `~/.ssh/` created
- [ ] cloudflared removed from Mac

**Server Phase 1**
- [ ] Ubuntu 22.04 installed, updated
- [ ] Timezone set to Asia/Kolkata
- [ ] Hostname set to `joules-campus`
- [ ] Swap (2GB) configured
- [ ] SSH key generated on server
- [ ] Mac public key added to server `authorized_keys`
- [ ] SSH hardened (port 2222, no password auth)
- [ ] SSH tested from Mac successfully
- [ ] Mac `~/.ssh/config` shortcut created (`ssh joules` works)
- [ ] UFW firewall enabled (port 2222 only)

**Cloudflare Phase 2**
- [ ] All 3 domains added to Cloudflare
- [ ] Nameservers updated at registrar
- [ ] `cloudflared` installed on server
- [ ] `cloudflared tunnel login` done (selected `joules.fun`)
- [ ] Tunnel `joules-server` created, Tunnel ID saved
- [ ] `/etc/cloudflared/config.yml` created with all hostnames
- [ ] Credentials and cert copied to `/etc/cloudflared/`
- [ ] `code.joules.fun`, `db.joules.fun`, `ssh.joules.fun` — added via CLI
- [ ] `campuscontrol.in`, `www`, `status` — added via Cloudflare Dashboard
- [ ] `joulestechnologies.in`, `www` — added via Cloudflare Dashboard
- [ ] Tunnel service installed and running (`active (running)`)
- [ ] `cloudflared` installed on Mac via brew
- [ ] Mac `~/.ssh/config` updated with `ProxyCommand`
- [ ] `ssh joules` works via domain (no IP needed)

**Docker & Apps**
- [ ] Docker & Docker Compose installed
- [ ] `/opt/` folder structure created
- [ ] Infrastructure stack running (PostgreSQL, pgAdmin, code-server, Uptime Kuma)
- [ ] Databases `campuscontrol` and `joulestechnologies` created
- [ ] CampusControl app cloned, built, running
- [ ] App live at `https://campuscontrol.in`
- [ ] Cloudflare Zero Trust protecting `code.joules.fun` and `db.joules.fun`
- [ ] Fail2ban running
- [ ] Backup cron job set
- [ ] GitHub Actions deploy pipeline working

---

*Guide — Joules Technologies / CampusControl Infrastructure*
*Updated: April 2026*

# Portainer Deployment Guide

## Quick Deploy Steps

### 1. Prepare on VPS

```bash
# Create project directory
mkdir -p /opt/xyz-portal
cd /opt/xyz-portal

# Clone/Copy your repository
git clone <your-repo> .
# or copy files manually via SFTP
```

### 2. Configure Nginx (on VPS)

```bash
# Copy nginx config
sudo cp nginxauth.conf /etc/nginx/sites-available/xyz
sudo ln -s /etc/nginx/sites-available/xyz /etc/nginx/sites-enabled/
sudo systemctl reload nginx
```

### 3. Create Basic Auth (on VPS)

```bash
# Create htpasswd file
sudo htpasswd -c /etc/nginx/.htpasswd-xyz your-username
# Enter password twice

# Secure permissions
sudo chmod 644 /etc/nginx/.htpasswd-xyz
```

### 4. Deploy via Portainer

#### Option A: Stack Upload

1. Log into Portainer
2. Go to **Stacks** → **Add Stack**
3. **Upload** the `docker-compose.yml` file
4. Name it: `xyz-portal`
5. Click **Deploy**

#### Option B: Stack via Editor

1. Go to **Stacks** → **Add Stack**
2. **Editor** - paste docker-compose content:

```yaml
version: '3.8'

services:
  xyz-portal:
    build:
      context: /opt/xyz-portal
      dockerfile: Dockerfile
    container_name: xyz-portal
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    restart: unless-stopped
    networks:
      - xyz-network
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 5s

networks:
  xyz-network:
    driver: bridge
```

3. Click **Deploy**

#### Option C: Manual CLI Deploy

```bash
# SSH into your VPS
cd /opt/xyz-portal

# Deploy with docker-compose
docker-compose up -d

# Check status
docker-compose ps
docker-compose logs -f xyz-portal
```

### 5. Update Apps

Edit `/opt/xyz-portal/apps.json` and add your applications:

```json
[
  {
    "name": "Nextcloud",
    "description": "Cloud Storage",
    "url": "https://atlas.theo-manya.fr"
  },
  {
    "name": "Portainer",
    "description": "Docker Management",
    "url": "https://ship.theo-manya.fr"
  }
]
```

Restart container for changes:

```bash
docker-compose restart xyz-portal
```

### 6. Access Your Portal

Visit: `https://xyz.theo-manya.fr`

- Username: your-username
- Password: the password you created

## Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs xyz-portal

# Rebuild
docker-compose build --no-cache
docker-compose up -d
```

### Can't reach Nginx reverse proxy

```bash
# Verify Nginx config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Check network connectivity
docker network ls
docker exec xyz-portal ping host.docker.internal
```

### 401 Unauthorized

- Verify Nginx has `proxy_set_header Remote-User $remote_user;`
- Check htpasswd file exists: `ls -la /etc/nginx/.htpasswd-xyz`
- Test Nginx auth: `curl --basic -u username:password https://xyz.theo-manya.fr/`

### Favicons not loading

- Container needs internet access
- Check container DNS: `docker exec xyz-portal nslookup google.com`
- Fallback SVG should still show if API fails

## Portainer Stack Management

### Monitor Container

In Portainer:
1. Go to **Containers**
2. Find `xyz-portal`
3. View **Logs**, **Stats**, **Inspect**

### Update Container

1. Edit `/opt/xyz-portal/apps.json`
2. In Portainer → **Stacks** → `xyz-portal` → **Re-deploy**

### Backup

```bash
# Backup apps.json
cp /opt/xyz-portal/apps.json /backup/apps.json.backup

# Backup entire project
tar -czf /backup/xyz-portal-$(date +%Y%m%d).tar.gz /opt/xyz-portal
```

## Performance Tuning

### Nginx Caching

Add to nginx location block:

```nginx
# Cache static assets
location ~* \.(js|css|svg|png|jpg)$ {
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

### Docker Resource Limits

Add to docker-compose.yml:

```yaml
services:
  xyz-portal:
    # ... existing config
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M
        reservations:
          cpus: '0.25'
          memory: 128M
```

## Security Checklist

- ✅ Nginx basic auth enabled
- ✅ HTTPS/SSL configured  
- ✅ Security headers set (HSTS, CSP, X-Frame-Options)
- ✅ Docker container runs as non-root
- ✅ Firewall rules restrict access to Nginx only
- ✅ Regular backups of apps.json
- ✅ Container auto-restart enabled

---

Need help? Check the main [README.md](./README.md)

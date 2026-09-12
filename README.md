# XYZ Portal

A lightweight, modern app portal with dark UI, Nginx auth integration, and automatic favicon fetching. Perfect for self-hosted ecosystems.

**Features:** Minimal (~50MB), dark theme, responsive design, secure auth headers, auto-favicon caching, zero framework bloat.

## Quick Start

### Docker (Terminal)

```bash
# Build image
docker build -t xyz-portal .

# Run container
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  xyz-portal

# Or with docker-compose
docker-compose up -d
```

Visit `http://localhost:3000` (auth will fail without Nginx header - that's normal)

### Docker Compose (Recommended)

```bash
docker-compose up -d
```

Check status:
```bash
docker-compose ps
docker-compose logs -f
```

### Portainer

1. **Stacks** → **Add Stack**
2. Click **Upload** → select `docker-compose.yml`
3. Name: `xyz-portal`
4. Click **Deploy**

### Local Development

```bash
npm install
npm run dev       # With watch
npm start         # Production
```

## Deployment on VPS

```bash
# 1. Clone repo
cd /opt/xyz-portal
git clone <your-repo> .

# 2. Update apps.json with your apps
nano apps.json

# 3. Configure Nginx (update domain and paths)
sudo cp nginxauth.conf /etc/nginx/sites-available/xyz
sudo ln -s /etc/nginx/sites-available/xyz /etc/nginx/sites-enabled/

# 4. Create basic auth
sudo htpasswd -c /etc/nginx/.htpasswd-xyz your-username

# 5. Reload Nginx
sudo systemctl reload nginx

# 6. Deploy with docker-compose
docker-compose up -d
```

## Configuration

**apps.json** - List your applications:
```json
[
  {
    "name": "Nextcloud",
    "description": "Cloud Storage",
    "url": "https://atlas.theo-manya.fr"
  }
]
```

**Nginx** - Edit `nginxauth.conf`:
- Update `server_name` to your domain
- Update SSL certificate paths
- Update upstream proxy if needed

## API

- `GET /` - Portal UI (requires `Remote-User` header)
- `GET /api/apps` - List apps
- `GET /api/favicon?url=https://example.com` - Get favicon

## Troubleshooting

**401 Unauthorized** - Check Nginx config has `proxy_set_header Remote-User $remote_user;`

**Favicons not loading** - Container needs internet. Falls back to placeholder if API fails.

**Container won't start** - Check logs: `docker-compose logs xyz-portal`

## Makefile Commands

```bash
make dev        # Development server
make build      # Build Docker image
make deploy     # Start with docker-compose
make logs       # View container logs
make shell      # SSH into container
```

See [PORTAINER.md](PORTAINER.md) for detailed Portainer guide.
# Build image
docker build -t xyz-portal:latest .

# Run container
docker run -p 3000:3000 xyz-portal:latest
```

### Docker Compose (Recommended)

```bash
# Deploy
docker-compose up -d

# Check logs
docker-compose logs -f xyz-portal

# Stop
docker-compose down
```

## Configuration

### apps.json

Define your applications:

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

### Nginx Configuration

Update `nginxauth.conf` with your domain and SSL paths:

```nginx
server {
    server_name xyz.your-domain.com;
    listen 443 ssl http2;

    ssl_certificate /etc/letsencrypt/live/xyz.your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/xyz.your-domain.com/privkey.pem;

    auth_basic "XYZ Portal";
    auth_basic_user_file /etc/nginx/.htpasswd-xyz;

    location / {
        proxy_pass http://xyz-portal:3000;
        proxy_set_header Remote-User $remote_user;
        # ... other headers
    }
}
```

### Basic Auth Setup

Create htpasswd file (on your VPS):

```bash
# Install apache2-utils if needed
sudo apt-get install apache2-utils

# Create/update htpasswd file
sudo htpasswd -c /etc/nginx/.htpasswd-xyz username

# Restart nginx
sudo systemctl restart nginx
```

## Portainer Integration

1. **Upload Stack**: Go to Portainer → Stacks → "Upload"
2. **Select compose file**: `docker-compose.yml`
3. **Set name**: `xyz-portal`
4. **Deploy**: Click "Deploy Stack"

## API Endpoints

### Authenticated Routes (requires `Remote-User` header)

- `GET /` - Portal UI
- `GET /api/apps` - List all apps from apps.json
- `GET /api/favicon?url=https://example.com` - Get favicon for domain

### Example curl (with auth header)

```bash
curl -H "Remote-User: user123" http://localhost:3000/api/apps
```

## Performance

- **Image size**: ~50MB (Alpine Node.js base)
- **Memory**: ~30-50MB at idle
- **Startup**: <2 seconds
- **First paint**: ~500ms
- **Favicon cache**: In-memory (resets on restart)

## Customization

### Colors

Edit `public/style.css` CSS variables:

```css
:root {
    --bg-primary: #0f1419;
    --text-primary: #e4e6eb;
    --accent: #3b82f6;
    /* ... */
}
```

### Port

Change in `docker-compose.yml`:

```yaml
ports:
  - "3000:3000"  # Change first number for host port
```

## Troubleshooting

### 401 Unauthorized

- Ensure Nginx is passing `Remote-User` header
- Check Nginx config has `proxy_set_header Remote-User $remote_user;`

### Favicons not loading

- Internet connection required (uses Google Favicon API)
- Falls back to placeholder SVG on error

### Container won't start

```bash
# Check logs
docker-compose logs xyz-portal

# Rebuild
docker-compose build --no-cache

# Verify ports aren't in use
lsof -i :3000
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Android)

## License

MIT

---

Made with ❤️ for self-hosted enthusiasts

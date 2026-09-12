# XYZ Portal 🚀

Lightweight app portal with dark modern design, Nginx auth support, and automatic favicon fetching.

## Features

✨ **Lightweight** - Minimal dependencies, ~50MB docker image  
🔐 **Secure** - Nginx auth integration via headers  
🎨 **Modern Dark UI** - Inspired by Gokapi, NextCloud, Portainer  
⚡ **Fast** - No framework bloat, pure Node.js + vanilla JS  
🖼️ **Auto Favicons** - Fetches and caches app icons  
📱 **Responsive** - Mobile-friendly design  

## Architecture

```
XYZ Portal (Container)
    ↑
    └─ Nginx (Reverse proxy with auth)
        ↑
        └─ Browser
```

1. Nginx handles authentication (basic auth)
2. Nginx passes authenticated username via `Remote-User` header
3. Portal validates header and serves authenticated content
4. Portal reads apps from `apps.json` and displays them
5. Frontend fetches favicons automatically via Google Favicon API

## Setup

### Local Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Or production
npm start
```

App will be available at `http://localhost:3000`  
⚠️ Note: No auth header = 401 Unauthorized (normal, auth is handled by nginx in production)

### Docker

```bash
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

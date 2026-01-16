# FlowMatic Docker/Podman Setup

This directory contains the docker-compose configuration for running FlowMatic with Podman on SELinux-enabled servers.

## Prerequisites

- Podman (3.0+)
- podman-compose
- SELinux enabled system

## Quick Start

1. **Copy environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Start services:**
   ```bash
   # Local development (no Cloudflare Tunnel)
   podman-compose up -d

   # Production with Cloudflare Tunnel
   podman-compose --profile production up -d
   ```

3. **Access the application:**
   - Local Frontend: http://localhost:5173
   - Local Backend: http://localhost:8000
   - Production (if configured): https://app.yourdomain.com

## SELinux Configuration

The volumes use the `:z` suffix for proper SELinux labeling:
- `:z` - Shared label (suitable for multiple containers)
- Required for rootless podman to share volumes

If you encounter permission issues, manually label directories:
```bash
chcon -R --type=svirt_sandbox_file_t /path/to/directory
```

## Services

- **backend**: Django 5.2 + Daphne ASGI (port 8000)
  - Supports WebSocket connections
  - SQLite database (persistent via volume)
  
- **frontend**: React 19 + Vite dev server (port 5173)
  - Hot reload enabled
  - Auto-reload on code changes

## Commands

```bash
# Start services
podman-compose up -d

# Stop services
podman-compose down

# View logs
podman-compose logs -f

# Rebuild containers
podman-compose build --no-cache

# Execute command in backend
podman-compose exec backend python manage.py migrate
```

## Configuration

Edit `.env` to set:
- `SECRET_KEY`: Django secret key (generate with `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`)
- `DEBUG`: Set to `False` for production

## Development Notes

- Backend code changes auto-reload (Daphne ASGI)
- Frontend code changes auto-reload (Vite HMR)
- Database persists in `backend-db` volume
- Node modules are managed in container (not mounted)

## Cloudflare Tunnel (Internet Exposure)

Expose your FlowMatic application to the internet securely using Cloudflare Tunnel.

### Prerequisites

- Cloudflare account with a custom domain
- Cloudflare Tunnel token (obtained from Cloudflare Dashboard)

### Setup Steps

1. **Create Cloudflare Tunnel:**
   - Go to Cloudflare Dashboard → Zero Trust → Networks → Tunnels
   - Create a new tunnel and get your tunnel token

2. **Configure cloudflared.yaml:**
   ```bash
   cp cloudflared.yaml cloudflared.yaml.backup
   ```
   Edit `cloudflared.yaml`:
   ```yaml
   tunnel: <YOUR_TUNNEL_ID>
   credentials-file: /root/.cloudflared/<YOUR_TUNNEL_ID>.json

   ingress:
     - hostname: app.yourdomain.com  # Frontend
       service: http://frontend:5173
     - hostname: api.yourdomain.com  # Backend API
       service: http://backend:8000
     - service: http_status:404
   ```

3. **Configure DNS:**
   - In Cloudflare Dashboard, create CNAME records:
     - `app.yourdomain.com` → your tunnel domain
     - `api.yourdomain.com` → your tunnel domain

4. **Update .env for production:**
   ```bash
   DEBUG=False
   ALLOWED_HOSTS=app.yourdomain.com,api.yourdomain.com
   CORS_ALLOWED_ORIGINS=https://app.yourdomain.com
   VITE_API_URL=https://api.yourdomain.com
   VITE_WS_URL=wss://api.yourdomain.com
   CLOUDFLARE_TUNNEL_TOKEN=<your-tunnel-token>
   ```

5. **Start with Cloudflare Tunnel:**
   ```bash
   podman-compose up -d
   ```

6. **Access your application:**
   - Frontend: https://app.yourdomain.com
   - Backend API: https://api.yourdomain.com

### Security Notes

- All traffic is encrypted (HTTPS/WSS)
- DEBUG=False in production
- CORS restricted to your frontend domain
- SELinux enabled on host system
- Rootless podman recommended

### Troubleshooting

If tunnel doesn't start, check cloudflared logs:
```bash
podman-compose logs -f cloudflared
```

Verify DNS propagation:
```bash
dig app.yourdomain.com
```

### Local Development (Without Tunnel)

To run locally without Cloudflare Tunnel:
```bash
# Use default .env values (or remove CLOUDFLARE_TUNNEL_TOKEN)
# Comment out the cloudflared service in docker-compose.yaml
podman-compose up -d
```

Access at http://localhost:5173 and http://localhost:8000

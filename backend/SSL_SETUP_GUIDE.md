# SSL/HTTPS Setup Guide

This guide explains how to secure your emotion-aware learning platform with SSL/HTTPS certificates.

## Option 1: Using Nginx Reverse Proxy with Let's Encrypt (Recommended for Production)

### Prerequisites
- Ubuntu/Debian server
- Domain name pointed to your server
- Root access

### Step 1: Install Nginx
```bash
sudo apt update
sudo apt install nginx
```

### Step 2: Install Certbot
```bash
sudo apt install certbot python3-certbot-nginx
```

### Step 3: Configure Nginx for Your Backend

Create a new Nginx configuration:
```bash
sudo nano /etc/nginx/sites-available/emotion-learning
```

Add the following configuration:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeout for long-running requests
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    # Serve static files directly
    location /uploads {
        proxy_pass http://localhost:3001/uploads;
    }
}
```

Enable the configuration:
```bash
sudo ln -s /etc/nginx/sites-available/emotion-learning /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 4: Obtain SSL Certificate
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Certbot will automatically:
- Obtain a free SSL certificate from Let's Encrypt
- Configure Nginx to use HTTPS
- Set up automatic certificate renewal

### Step 5: Update Backend Environment Variables

Update your `.env` file:
```bash
FRONTEND_URL=https://yourdomain.com
NODE_ENV=production
```

### Step 6: Update Frontend Environment Variables

Update your frontend `.env.local`:
```bash
NEXT_PUBLIC_API_BASE_URL=https://yourdomain.com/api
```

## Option 2: Using Cloud Services with SSL Termination

### AWS Application Load Balancer (ALB)
1. Create an ALB in AWS
2. Attach SSL certificate from AWS Certificate Manager (ACM)
3. Configure health check to `/health` endpoint
4. Forward traffic to your backend on port 3001

### Cloudflare
1. Add your domain to Cloudflare
2. Enable "Full (Strict)" SSL mode
3. Configure SSL/TLS settings
4. Point your domain to Cloudflare nameservers
5. Cloudflare provides free SSL certificates

### Vercel (for Frontend)
1. Deploy frontend to Vercel
2. Vercel automatically provides HTTPS
3. Configure custom domain in Vercel dashboard

## Option 3: Self-Signed Certificate (Development Only)

### Generate Self-Signed Certificate
```bash
mkdir ssl
cd ssl
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
```

### Update Backend to Use HTTPS
```javascript
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('./ssl/key.pem'),
  cert: fs.readFileSync('./ssl/cert.pem')
};

https.createServer(options, app).listen(3001, () => {
  logger.info('HTTPS Server running on port 3001');
});
```

**Note**: Self-signed certificates will show browser warnings and should only be used for development.

## Security Headers Verification

After setting up SSL, verify security headers are working:

```bash
curl -I https://yourdomain.com/health
```

Expected headers:
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `X-XSS-Protection: 1; mode=block`
- `Content-Security-Policy: ...`

## Automatic Certificate Renewal

Let's Encrypt certificates expire every 90 days. Certbot sets up automatic renewal:

```bash
sudo certbot renew --dry-run
```

Check renewal timer:
```bash
sudo systemctl status certbot.timer
```

## Testing SSL Configuration

Use these tools to verify your SSL setup:

1. **SSL Labs Test**: https://www.ssllabs.com/ssltest/
2. **Security Headers**: https://securityheaders.com/
3. **HTTP Security Scanner**: https://observatory.mozilla.org/

## Environment Variables for Production

Update `.env` with production values:
```bash
# Server
PORT=3001
NODE_ENV=production

# MongoDB (use MongoDB Atlas for production)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/emolearn?retryWrites=true&w=majority

# CORS
FRONTEND_URL=https://yourdomain.com

# JWT (use strong random secret)
JWT_SECRET=your_very_long_random_secret_key_here
JWT_EXPIRES_IN=7d

# AI Service
AI_GATEWAY_URL=https://your-ai-service.com
AI_API_KEY=your_secure_ai_api_key

# Security
BCRYPT_ROUNDS=12
```

## Firewall Configuration

Configure UFW firewall:
```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

## Monitoring SSL Expiry

Set up monitoring to alert before certificate expiration:
```bash
# Check certificate expiry
echo | openssl s_client -servername yourdomain.com -connect yourdomain.com:443 2>/dev/null | openssl x509 -noout -dates
```

## Troubleshooting

### Certificate Renewal Fails
```bash
sudo certbot renew --force-renewal
```

### Mixed Content Errors
Ensure all resources (images, scripts) are loaded via HTTPS in your frontend.

### CORS Issues After SSL
Update `FRONTEND_URL` to use HTTPS in backend `.env`.

## Summary

For production deployment:
1. Use Nginx reverse proxy with Let's Encrypt (free, automatic renewal)
2. Or use cloud services (AWS ALB, Cloudflare) for SSL termination
3. Update all environment variables to use HTTPS URLs
4. Verify security headers are properly configured
5. Set up monitoring for certificate expiry

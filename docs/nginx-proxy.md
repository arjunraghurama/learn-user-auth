# Nginx Reverse Proxy Configuration

To serve our entire application stack securely over HTTPS from a single point of entry (`https://localhost`), we use **Nginx** as a reverse proxy. 

This approach mirrors production architecture and completely avoids Cross-Origin Resource Sharing (CORS) complexity, as the frontend, backend, and authentication server all share the exact same domain.

---

## 1. SSL Certificate Automation

In a local development environment, obtaining a real SSL certificate is difficult. To solve this, our Nginx container builds its own self-signed certificate on startup.

If you examine `nginx/Dockerfile`, you will see:
```dockerfile
# Install openssl to generate self-signed certs
RUN apk add --no-cache openssl

# Generate a 1-year valid self-signed cert for localhost
RUN mkdir -p /etc/nginx/ssl
RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/nginx.key \
    -out /etc/nginx/ssl/nginx.crt \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```
Because the certificate is self-signed, your browser will show a "Not Secure" warning when you first access `https://localhost`. This is expected entirely normal for local development.

---

## 2. Path-Based Routing

The core of our Nginx configuration (`nginx/nginx.conf`) is how it directs incoming traffic based on the URL path. Nginx listens solely on port `443` (HTTPS) and routes requests internally to the other Docker containers over standard unencrypted HTTP.

### The React Frontend (`/`)
Any request to the root path is forwarded to the React development server. We also forward WebSocket upgrade headers to ensure Vite's Hot Module Replacement (HMR) continues tracking code changes.
```nginx
location / {
    proxy_pass http://frontend:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

### The FastAPI Backend (`/api/`)
Requests starting with `/api/` are sent to the FastAPI backend. 
A critical detail here is the **trailing slash** on `http://backend:8000/`. This tells Nginx to strip the `/api/` prefix before forwarding the request. When the React app requests `https://localhost/api/todos`, FastAPI simply sees a request for `/todos`.
```nginx
location /api/ {
    proxy_pass http://backend:8000/;
}
```

### The Keycloak Server (`/auth/`)
Requests to `/auth/` are proxied directly to Keycloak. 
```nginx
location /auth/ {
    proxy_pass http://keycloak:8080/auth/;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

---

## 3. Keycloak Proxy Awareness

Keycloak is highly secure and needs to know its exact URL to issue valid tokens and redirect URIs. Since Keycloak is running inside Docker on `http://keycloak:8080` but users access it via `https://localhost/auth`, we had to inform it of the proxy.

In our `docker-compose.yml`, we explicitly configured Keycloak to trust the proxy headers sent by Nginx:
```yaml
environment:
  KC_PROXY_HEADERS: "xforwarded"
  KC_HTTP_RELATIVE_PATH: "/auth"
  KC_HOSTNAME_URL: "https://localhost/auth/"
  KC_HOSTNAME_ADMIN_URL: "https://localhost/auth/"
```
This ensures all tokens issued by Keycloak contain the correct HTTPS issuer URLs.

---

## 4. FastAPI Swagger UI Compatibility

Because Nginx strips the `/api/` prefix when forwarding requests to the FastAPI backend, the internal FastAPI application believes it is being served from the root domain. 

Without additional configuration, this breaks the interactive Swagger UI (`/docs`). When the UI attempts to fetch the `openapi.json` schema to build the documentation page, it requests `https://localhost/openapi.json` instead of `https://localhost/api/openapi.json`, resulting in a 404 error (or an invalid JSON parsing error if it accidentally hits the React frontend).

To fix this, we explicitly configure the `root_path` when initializing the FastAPI app in `backend/main.py`:

```python
app = FastAPI(title="Todo API with Keycloak", root_path="/api")
```

This tells FastAPI that it is mounted under a proxy subpath. FastAPI will then automatically prepend `/api` to all of its internal routing and OpenAPI schema endpoints, ensuring the Swagger UI functions correctly behind the Nginx reverse proxy.

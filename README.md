# Secure User Authentication Stack

This repository contains a full-stack proof-of-concept demonstrating how to secure a modern React frontend and a FastAPI backend using **Keycloak** Identity and Access Management.

The entire stack is containerized using Docker and is served securely behind an Nginx HTTPS reverse proxy to mirror a production environment and avoid CORS complexity.

## Architecture

*   **Reverse Proxy (Nginx):** Terminates SSL (`https://localhost`) and routes traffic to the appropriate internal services.
*   **Identity Provider (Keycloak):** Handles user registration, login, and token issuance. Backed by PostgreSQL.
*   **Frontend (React/Vite):** Client application that uses the `keycloak-js` adapter to manage user sessions and interact with the API.
*   **Backend API (FastAPI):** Python server that cryptographically verifies Keycloak JWTs before granting access to MongoDB records.

---

## 🚀 Setup Instructions

### Prerequisites
*   Docker & Docker Compose installed.

### 1. Start the Stack

Run the following command in the root of the repository to build and start all containers in detached mode:

```bash
docker compose up -d
```

*Note: The Nginx container will automatically generate self-signed SSL certificates upon building.*

### 2. Access the Application

Once the containers are healthy (this may take a few seconds for PostgreSQL and Keycloak to fully initialize), navigate to:

👉 **[https://localhost](https://localhost)**

Because we are using self-signed development certificates, your browser will display a "Not Secure" warning. 
*   In Chrome: Click `Advanced` -> `Proceed to localhost (unsafe)`.
*   In Firefox: Click `Advanced` -> `Accept the Risk and Continue`.

### 3. Test Credentials

The Keycloak realm (`myrealm`) is automatically imported on startup. It comes pre-configured with a test user:
*   **Username:** `testuser`
*   **Password:** `password`

You can also use the signup form to create a brand new user account.

### 4. Database Management Interfaces

Two database management UIs are spun up alongside the stack:

*   **pgAdmin** (PostgreSQL): [http://localhost:5050](http://localhost:5050) (Login: `admin@admin.com` / `password`)
*   **Mongo Express** (MongoDB): [http://localhost:8081](http://localhost:8081) (No login required)

---

## 📖 Documentation

Detailed documentation regarding the authentication flow, OAuth grant types, Keycloak configurations, and the Nginx proxy setup is available via MkDocs.

To view the documentation locally:

1. Spin up the docs container:
   ```bash
   docker compose -f docker-compose.docs.yml up -d
   ```
2. Navigate to **[http://localhost:8005](http://localhost:8005)**
3. When finished reading, stop the docs container:
   ```bash
   docker compose -f docker-compose.docs.yml down
   ```

---

## 🧹 Cleanup

To stop and remove all running containers, networks, and recreate your local environment state, run:

```bash
docker compose down
```

If you want to completely wipe the persistent database volumes (destroying all created users and To-Do items) so you can start from a completely clean slate next time, append the `-v` flag:

```bash
docker compose down -v
```

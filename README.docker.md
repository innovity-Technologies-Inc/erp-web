# React Frontend Docker Setup Guide

This guide describes how to run, configure, and build the Dockerized version of this frontend project. The setup uses a multi-stage target build to accommodate both local development and production-ready serving using Nginx.

---

## 1. Local Development Mode

To run a hot-reloading development server inside a Docker container:

### Step 1: Build the Development Stage
Specify the target stage as `development` during build:
```bash
docker build --target development -t erp-frontend:dev .
```

### Step 2: Run the Development Container
Mount your local source files to `/app` inside the container for hot-reloading:
```bash
docker run -d -p 5173:5173 -v ${PWD}:/app -v /app/node_modules --name erp_frontend_dev erp-frontend:dev
```
*(The `-v /app/node_modules` volume is important to prevent your local `node_modules` from overwriting the container's node_modules)*.

### Step 3: Access the Application
* **URL**: [http://localhost:5173](http://localhost:5173)

---

## 2. Building for Production

For production, Vite environment variables must be injected during the build step, as Vite compiles these variables into the static Javascript bundle.

### Step 1: Build the Image
Provide your production environment variables using `--build-arg`:
```bash
docker build \
  --target production \
  --build-arg VITE_API_URL=http://your-api-domain.com/api \
  --build-arg VITE_STORAGE_URL=http://your-api-domain.com/storage \
  --build-arg VITE_APP_NAME="Genitech ERP" \
  -t erp-frontend:latest .
```

### Step 2: Run the Nginx Container
```bash
docker run -d -p 8080:80 --name erp_frontend_web erp-frontend:latest
```

### Step 3: Access the Web App
* **URL**: [http://localhost:8080](http://localhost:8080)

---

## 3. Integrating with `docker-compose`

You can add this service to a root `docker-compose.yml` or run it side-by-side with your backend:

```yaml
  frontend:
    build:
      context: ./erp_frontend
      target: production # Change to development for local dev
      args:
        - VITE_API_URL=http://localhost:8000/api
        - VITE_STORAGE_URL=http://localhost:8000/storage
        - VITE_APP_NAME=Genitech ERP
    container_name: erp_frontend
    ports:
      - "8080:80"
    restart: unless-stopped
```

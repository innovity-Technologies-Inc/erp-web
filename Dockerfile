# ==========================================
# --- Base Stage (Node environment) ---
# ==========================================
FROM node:20-alpine AS base

# Install common node native dependencies / compatibility packages
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy dependency definition files to leverage Docker layer caching
COPY package.json package-lock.json ./

# ==========================================
# --- Development Stage (Vite Dev Server) ---
# ==========================================
FROM base AS development

# Install all dependencies including devDependencies
RUN npm ci

# Copy the rest of the application files
COPY . .

# Expose Vite's default dev server port
EXPOSE 5173

# Set runtime environment
ENV NODE_ENV=development

# Start development server binding to all network interfaces (host)
CMD ["npm", "run", "dev", "--", "--host"]

# ==========================================
# --- Build Stage (Production Compilation) ---
# ==========================================
FROM base AS builder

# Inject build-time environment variables for Vite compiler
ARG VITE_API_URL
ARG VITE_STORAGE_URL
ARG VITE_APP_NAME

# Bind args to ENV so they are compiled into the bundle
ENV VITE_API_URL=$VITE_API_URL \
    VITE_STORAGE_URL=$VITE_STORAGE_URL \
    VITE_APP_NAME=$VITE_APP_NAME \
    NODE_ENV=production

# Install dependencies (Vite and TypeScript are needed for building)
RUN npm ci

# Copy the application source code
COPY . .

# Build the application (outputs static bundle to /app/dist)
RUN npm run build

# ==========================================
# --- Production Web Stage (Nginx Web Server) ---
# ==========================================
FROM nginx:1.25-alpine AS production

# Remove default nginx configurations
RUN rm -rf /etc/nginx/conf.d/*

# Copy custom Nginx configuration with security headers & gzip compression
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf

# Copy static built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Set correct permissions for security
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

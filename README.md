# ERP Frontend - Setup & Installation Guide

This document provides a comprehensive, step-by-step guide to setting up and running the ERP Frontend project on a new laptop or a production server.

## 🚀 Prerequisites

Before you begin, ensure you have the following installed on your machine:

1.  **Node.js**: Version 20.x or higher (LTS recommended).
2.  **npm**: Version 10.x or higher (comes with Node.js).
3.  **Git**: For cloning the repository.
4.  **Backend API**: Ensure the Laravel backend is running and accessible via a URL.

---

## 🛠️ Step-by-Step Setup

### 1. Clone the Repository
Open your terminal and run:
```bash
git clone <your-repository-url>
cd erp_new/erp_frontend
```

### 2. Configure Environment Variables
The project requires a `.env` file to communicate with the backend API.
1.  Copy the example environment file:
    ```bash
    cp .env.example .env
    ```
2.  Open `.env` in your code editor and update the following:
    ```env
    VITE_API_URL=http://your-backend-api-url.test/api
    ```
    *Replace `http://your-backend-api-url.test` with the actual URL where your Laravel server is running.*

### 3. Install Dependencies
Install all required packages using npm:
```bash
npm install
```

### 4. Run Development Server
To start the project locally:
```bash
npm run dev
```
By default, it runs on `http://localhost:5173`.

#### 📱 Access from another laptop/mobile
If you want to view the project from another device on the same Wi-Fi:
```bash
npm run dev -- --host
```
Then, use the **Network IP** (e.g., `http://192.168.1.10:5173`) shown in your terminal.

---

## 🏗️ Production Deployment

### 1. Build for Production
```bash
npm run build
```
This generates a `dist/` folder.

### 2. Serving the Build
To test the production build locally or on a basic server:
```bash
# Install a static server
npm install -g serve
# Run the server
serve -s dist
```

### 3. Nginx / Apache Configuration
For a professional server setup, point your web server to the `dist/` folder.
**Nginx Example:**
```nginx
server {
    listen 80;
    server_name your-erp-domain.com;
    root /path/to/erp_new/erp_frontend/dist;

    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 🧪 Advanced Features

### Professional Excel Export
The project uses `exceljs` and `file-saver` for high-quality exports. 
- **Column Widths**: Auto-calculated based on data content.
- **Styling**: Branded primary-color headers and formatted dates.

### Date Navigation
The Date Range Picker supports quick navigation across years (e.g., 1990) via top dropdowns.

---

## 🆘 Troubleshooting

- **Node Version Error**: Ensure you are using a modern Node version. Check with `node -v`.
- **API Connection Refused**: Check if your `VITE_API_URL` in `.env` is correct and the backend is running.
- **Missing Icons**: Ensure `lucide-react` is installed correctly.

---
*Last Updated: May 2026*

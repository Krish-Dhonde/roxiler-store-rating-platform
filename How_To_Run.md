# How to Run the Roxiler Store Rating & Management Platform

This guide provides step-by-step instructions for running the complete application together from the root workspace or running the backend and frontend separately in distinct terminals.

---

## 📌 Prerequisites

Before running the project, make sure you have the following installed on your machine:

1. **Node.js**: v18.0.0 or higher ([Download Node.js](https://nodejs.org/))
2. **npm**: v9.0.0 or higher (comes bundled with Node.js)
3. **MySQL Server**: v8.0 or higher running locally on port `3306` ([Download MySQL](https://dev.mysql.com/downloads/installer/))
4. **Git**: Installed for version control

---

## ⚙️ Step 1: Environment Variables Setup

### 1. Backend Environment Configuration (`server/.env`)
Create or verify a file named `.env` inside the `server/` directory:

```env
PORT=5000
NODE_ENV=development

# MySQL Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=roxiler_rating_db

# Security & JWT
JWT_SECRET=roxiler_secure_jwt_token_secret_key_2026
JWT_EXPIRES_IN=7d
```

> [!IMPORTANT]
> Replace `your_mysql_password` with your actual local MySQL root password.

### 2. Frontend Environment Configuration (`client/.env`)
Create or verify a file named `.env` inside the `client/` directory:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 📦 Step 2: Install Dependencies

From the root project directory, run:

```bash
# Install root orchestration tools
npm install

# Install both backend and frontend dependencies concurrently
npm run install:all
```

---

## 🗄️ Step 3: Initialize & Seed the MySQL Database

Ensure your MySQL server service is active, then execute:

```bash
# From the root directory:
npm run init-db
```

This command automatically:
- Creates the `roxiler_rating_db` database if it doesn't exist.
- Creates the `users`, `stores`, and `ratings` tables with foreign keys and unique constraints.
- Seeds the initial demo accounts, stores, and ratings across Indian locations.

---

## 🚀 Option A: Run the Entire Project Completely (Recommended)

You can launch both the Express backend API and the React Vite frontend concurrently using a single command from the project root:

```bash
# Run from project root
npm run dev
```

- **Frontend Application:** [`http://localhost:5173`](http://localhost:5173)
- **Backend REST API:** [`http://localhost:5000`](http://localhost:5000)
- **API Health Check:** [`http://localhost:5000/api/health`](http://localhost:5000/api/health)

---

## 🛠️ Option B: Run Backend and Frontend Separately

If you prefer to run services in separate terminal windows:

### Terminal 1 — Start the Backend Server:
```bash
# Navigate to the server folder
cd server

# Start the Express server with Nodemon (auto-reload on code change)
npm run dev
```
*Backend runs on `http://localhost:5000`.*

### Terminal 2 — Start the Frontend Client:
```bash
# Navigate to the client folder
cd client

# Start the Vite development server
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

---

## 🧪 Running Automated Test Suite

To run the automated integration tests verifying database integrity, role-based access control (RBAC), and authentication:

```bash
# From the root directory:
npm test

# Or directly from the server folder:
cd server
npm test
```

---

## 🔑 Demo Login Credentials

You can sign in using any of the seeded demo accounts:

| Role | Email | Password | Primary Scope |
|---|---|---|---|
| **System Administrator** | `admin@roxiler.com` | `Admin@1234` | Full Platform & User Management |
| **System Administrator** | `priya.admin@roxiler.com` | `Admin@5678` | Full Platform Governance |
| **Store Owner** | `owner@store.com` | `Owner@1234` | Store Analytics & Feedback Table |
| **Customer (Normal User)** | `user@example.com` | `User@1234` | Browse Stores & Submit Star Ratings |

*(See [`CREDENTIALS.md`](file:///c:/Users/vansh/OneDrive/Desktop/Roxiler%20Assignment/CREDENTIALS.md) for full account listings).*

---

## ❓ Troubleshooting

1. **Database Connection Error (`ECONNREFUSED 127.0.0.1:3306`):**
   - Ensure your MySQL server is running in Windows Services or MySQL Workbench.
   - Verify `DB_PASSWORD` in `server/.env`.

2. **Port 5000 or 5173 in use:**
   - Terminate previous node processes or update `PORT` in `server/.env` and `VITE_API_BASE_URL` in `client/.env`.

3. **Force Reset Database:**
   ```bash
   cd server
   node src/config/initDb.js --force
   ```

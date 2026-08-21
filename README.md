# Roxiler Systems — Store Rating & Management Platform

A recruitment-ready, production-grade Full-Stack Web Application built with **Node.js**, **Express**, **MySQL**, and **React (Vite)**. The platform enables customers to discover and rate local stores across India, provides store owners with real-time customer feedback analytics, and empowers system administrators with complete platform governance.

---

## 📑 Table of Contents
1. [Key Features](#1-key-features)
2. [User Personas & Role Matrix](#2-user-personas--role-matrix)
3. [Technology Stack](#3-technology-stack)
4. [System Architecture](#4-system-architecture)
5. [Database Schema & Constraints](#5-database-schema--constraints)
6. [Folder Structure](#6-folder-structure)
7. [Environment Configuration](#7-environment-configuration)
8. [Installation & Setup Guide](#8-installation--setup-guide)
9. [REST API Documentation](#9-rest-api-documentation)
10. [Demo & Testing Credentials](#10-demo--testing-credentials)
11. [Automated Test Suite](#11-automated-test-suite)
12. [Security & Architectural Defenses](#12-security--architectural-defenses)

---

## 1. Key Features

- **Multi-Tenant Role-Based Access Control (RBAC):** Cryptographically enforced permissions for **System Administrator**, **Store Owner**, and **Normal User (Customer)**.
- **Self-Serve Merchant Onboarding:** Dedicated two-column notebook onboarding flow (`/register-store`) enabling new store owners to register their business and owner account in an atomic database transaction.
- **Atomic Star Ratings:** Atomic UPSERT (`INSERT ... ON DUPLICATE KEY UPDATE`) on composite unique constraint `(user_id, store_id)` preventing race conditions and double-voting.
- **Store Owner Customer Feedback Tabular View:** Filterable, sortable, and paginated customer rating breakdown table (Name, Email, Rating Score, Submission Date) with live search and star-rating distribution filters.
- **Modern Sharp Light Theme & Left Sidebar:** Left-aligned vertical navigation bar, top header with user avatar menu, and a crisp 0px radius light design system.
- **Live Password Complexity Checklist:** Real-time red ↔ green dynamic visual validation for password length, uppercase letter, and special character requirements.
- **Cartesian-Safe SQL Aggregations:** Derived-table subqueries prevent row-multiplication distortion when calculating store rating averages (`ROUND(AVG(rating), 2)`) and review counts.

---

## 2. User Personas & Role Matrix

| Capability / Feature | Normal User (Customer) | Store Owner | System Administrator |
|---|:---:|:---:|:---:|
| **Public Customer Signup** | ✅ | ❌ | ❌ |
| **Self-Serve Store Owner Registration** | ❌ | ✅ | ❌ |
| **Browse Stores Directory & Search** | ✅ | ✅ (Read-Only) | ✅ (Read-Only) |
| **Submit / Modify 1–5 Star Store Ratings** | ✅ | ❌ | ❌ |
| **View Personal Ratings History ("My Ratings")** | ✅ | ❌ | ❌ |
| **Store Owner Dashboard & Rating Metrics** | ❌ | ✅ (Owned Stores) | ❌ |
| **Tabular Customer Feedback View & Filtering** | ❌ | ✅ | ❌ |
| **Add New Store Location from Dashboard** | ❌ | ✅ | ✅ |
| **System Admin Dashboard Overview Metrics** | ❌ | ❌ | ✅ |
| **User Account Management (CRUD & Roles)** | ❌ | ❌ | ✅ |
| **Store Registry & Owner Assignment** | ❌ | ❌ | ✅ |

---

## 3. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend Framework** | React 19 + Vite | High-performance Single Page Application (SPA) |
| **Routing** | React Router v6 | Client-side role-guarded routing & layouts |
| **HTTP Client** | Axios | Centralized API client with JWT Bearer interceptors |
| **Styling** | Pure Vanilla CSS | Custom design system with light theme tokens & sharp corners |
| **Icons** | Lucide React | Modern, consistent vector iconography |
| **Backend Runtime** | Node.js (ES Modules) | Asynchronous backend server runtime |
| **API Framework** | Express.js | REST API routing, controllers, and middleware pipeline |
| **Database** | MySQL (InnoDB) | Relational storage with foreign keys and unique constraints |
| **Database Driver** | `mysql2/promise` | Connection pooling and parameterized SQL queries |
| **Authentication** | `jsonwebtoken` + `bcryptjs` | Stateless JWT auth and salted bcrypt password hashing |

---

## 4. System Architecture

```text
┌────────────────────────────────────────────────────────┐
│               Client-Side Single Page App              │
│  React 19 + React Router v6 + AuthContext + Axios      │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTP Requests (JSON + Bearer JWT)
                           ▼
┌────────────────────────────────────────────────────────┐
│                  Express.js REST API                   │
│                                                        │
│  [Middleware Pipeline]                                 │
│   ├── cors() + express.json()                          │
│   ├── authenticateToken (JWT Verification)             │
│   ├── requireRole(['admin' | 'owner' | 'user'])        │
│   └── Input Validators (Regex & Range Constraints)     │
│                                                        │
│  [Controllers & Whitelisted SQL Builders]             │
│   ├── authController.js                                │
│   ├── storeController.js                               │
│   ├── ratingController.js                              │
│   ├── ownerController.js                               │
│   └── adminController.js                               │
└──────────────────────────┬─────────────────────────────┘
                           │ Parameterized SQL Queries (?)
                           ▼
┌────────────────────────────────────────────────────────┐
│                   MySQL Database                       │
│  roxiler_rating_db (InnoDB, utf8mb4)                   │
│   ├── users   (id, name, email, password_hash, role)   │
│   ├── stores  (id, name, email, address, owner_id)     │
│   └── ratings (id, user_id, store_id, rating, UNIQUE)  │
└────────────────────────────────────────────────────────┘
```

---

## 5. Database Schema & Constraints

### Tables Definition

```sql
-- 1. Users Table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(60) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  address VARCHAR(400) NOT NULL,
  role ENUM('admin', 'user', 'owner') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Stores Table
CREATE TABLE stores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(60) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  address VARCHAR(400) NOT NULL,
  owner_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_stores_owner FOREIGN KEY (owner_id) 
    REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 3. Ratings Table
CREATE TABLE ratings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  store_id INT NOT NULL,
  rating TINYINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_ratings_user FOREIGN KEY (user_id) 
    REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_ratings_store FOREIGN KEY (store_id) 
    REFERENCES stores(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT unique_user_store UNIQUE (user_id, store_id)
) ENGINE=InnoDB;
```

---

## 6. Folder Structure

```text
Roxiler Assignment/
├── CREDENTIALS.md              # Demo credentials & account capabilities reference
├── Description.md              # Human-written architecture & feature summary
├── How_To_Run.md               # Guide to run complete or separate services
├── README.md                   # Comprehensive platform documentation
├── package.json                # Root orchestration scripts
├── client/                     # Frontend Single Page Application
│   ├── src/
│   │   ├── components/         # Common, layout, modal, and owner components
│   │   ├── context/            # Global AuthContext & state hydration
│   │   ├── hooks/              # Custom hooks (useAuth, useDebounce)
│   │   ├── layouts/            # MainLayout (Sidebar+Header) & AuthLayout
│   │   ├── pages/              # Admin, Owner, Customer, Auth, and Shared views
│   │   ├── routes/             # AppRoutes, ProtectedRoute, PublicOnlyRoute
│   │   ├── services/           # Axios API modules (auth, stores, ratings, owner, admin)
│   │   ├── styles/             # Vanilla CSS design tokens (index, components, layout)
│   │   └── utils/              # Validation regex and date formatters
│   └── vite.config.js          # Vite build configuration
└── server/                     # Backend REST API
    ├── src/
    │   ├── config/             # MySQL connection pool & initDb seeder
    │   ├── controllers/        # Request handlers with parameter validation
    │   ├── middlewares/        # JWT auth, RBAC, input validation, error handling
    │   ├── routes/             # Express API routes
    │   └── utils/              # JWT token generator & verify helper
    └── test/                   # Automated integration test suites
```

---

## 7. Environment Configuration

### Backend (`server/.env`)
```env
PORT=5000
NODE_ENV=development

# MySQL Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=roxiler_rating_db

# Security
JWT_SECRET=super_secret_roxiler_jwt_key_2026_production_ready
JWT_EXPIRES_IN=7d
```

### Frontend (`client/.env`)
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 8. Installation & Setup Guide

### 1. Clone & Install Dependencies
```bash
git clone <your-repo-url>
cd "Roxiler Assignment"

# Install root dependencies
npm install

# Install server & client dependencies concurrently
npm run install:all
```

### 2. Configure MySQL Database
Make sure your local MySQL server is running on port 3306, then configure `server/.env` with your credentials.

### 3. Initialize & Seed Database
```bash
# Run database migrations and seed Indian demo data
npm run init-db
```

### 4. Start Development Servers
```bash
# Concurrently start Express API (Port 5000) and React Vite (Port 5173)
npm run dev
```

Visit [`http://localhost:5173`](http://localhost:5173) in your browser.

---

## 9. REST API Documentation

### Public & Authentication Endpoints
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/signup` | Register a new customer account | Public |
| `POST` | `/api/auth/register-store` | Register new store & owner account (Atomic) | Public |
| `POST` | `/api/auth/login` | Unified login for all roles | Public |
| `GET` | `/api/auth/me` | Fetch currently authenticated user profile | Authenticated |
| `PATCH` | `/api/auth/change-password` | Update user password | Authenticated |

### Store Explorer & Ratings Endpoints
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/stores` | List stores with search, sort, and pagination | Public / Auth |
| `POST` | `/api/ratings` | Submit initial 1–5 star rating for a store | Customer Only |
| `PUT` | `/api/ratings/:storeId` | Modify existing rating for a store | Customer Only |
| `GET` | `/api/ratings/my-ratings` | Fetch stores rated by the logged-in customer | Customer Only |

### Store Owner Endpoints
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/owner/stores` | Get stores, average ratings, and customer feedback table | Store Owner Only |
| `POST` | `/api/owner/stores` | Add new store location for current owner | Store Owner Only |

### System Administrator Endpoints
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/admin/dashboard` | Get platform metrics (Total Users, Stores, Ratings) | Admin Only |
| `GET` | `/api/admin/users` | List users with search, role filter, sort, pagination | Admin Only |
| `POST` | `/api/admin/users` | Create user account with explicit role assignment | Admin Only |
| `GET` | `/api/admin/stores` | List all stores with owner details and rating metrics | Admin Only |
| `POST` | `/api/admin/stores` | Create new store and assign to an existing owner | Admin Only |

---

## 10. Demo & Testing Credentials

| # | Role | Name | Email | Password | Access Scope |
|---|---|---|---|---|---|
| **1** | **System Administrator** | Aarav Sharma | `admin@roxiler.com` | `Admin@1234` | `/admin/*` (All Governance Controls) |
| **2** | **System Administrator** | Priya Patel | `priya.admin@roxiler.com` | `Admin@5678` | `/admin/*` (All Governance Controls) |
| **3** | **Store Owner** | Rajesh Kumar | `owner@store.com` | `Owner@1234` | `/owner/dashboard` (FabIndia, Chai Point) |
| **4** | **Store Owner** | Ananya Deshmukh | `ananya.owner@store.com` | `Owner@5678` | `/owner/dashboard` (Nature's Basket, Crossword) |
| **5** | **Store Owner** | Vikram Malhotra | `vikram.owner@store.com` | `Owner@9012` | `/owner/dashboard` (Haldiram's, Croma) |
| **6** | **Customer (User)** | Amitabh Sen | `user@example.com` | `User@1234` | `/stores`, `/user/ratings` |
| **7** | **Customer (User)** | Rohit Verma | `rohit.customer@example.com` | `User@1234` | `/stores`, `/user/ratings` |
| **8** | **Customer (User)** | Sneha Reddy | `sneha.customer@example.com` | `User@5678` | `/stores`, `/user/ratings` |
| **9** | **Customer (User)** | Pooja Sharma | `pooja.customer@example.com` | `User@9012` | `/stores`, `/user/ratings` |

---

## 11. Automated Test Suite

The project includes an end-to-end automated integration test suite verifying database integrity, RBAC security, and API endpoints:

```bash
# Run test suite from root
npm test

# Or run directly in server
cd server
npm test
```

---

## 12. Security & Architectural Defenses

1. **SQL Injection Prevention:** 100% of database queries use parameterized placeholders (`?`). Dynamic sort columns and directions are strictly whitelisted against static sets.
2. **Password Security:** Salted bcrypt hashing with 10 rounds. Plaintext passwords and hashes are never exposed in API responses.
3. **Strict RBAC Enforcement:** Role checks are cryptographically verified via JWT tokens and validated on protected endpoints.
4. **Anti-Fraud Rating Rules:** Store owners and administrators are forbidden from rating stores to eliminate conflicts of interest.

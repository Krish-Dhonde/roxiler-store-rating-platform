# Project Description — Roxiler Store Rating & Management Platform

## 📖 About The Project

The **Roxiler Store Rating & Management Platform** is a full-stack web application designed to connect everyday shoppers with local businesses across India. The idea behind this platform is simple: give customers a transparent and easy way to discover and rate physical stores, give store owners clear analytics and feedback about their performance, and provide platform administrators with full control over user accounts and merchant store listings.

Rather than building a generic CRUD app, we crafted this platform with high attention to real-world software engineering principles, security safeguards, anti-fraud mechanisms, and modern user experience design.

---

## 💻 Technologies & Tools Used

Here is an honest breakdown of the technologies chosen for this project and why we picked them:

### Backend
- **Node.js & Express.js:** We used Node.js with modern ES Modules (`import/export`) and Express.js for the REST API. Express provides a lightweight, modular middleware pipeline that lets us easily handle token verification, role permissions, and input validation.
- **MySQL Database (InnoDB Engine):** We chose MySQL because relational integrity is crucial for rating platforms. Foreign keys with cascading rules ensure that when stores or users are updated, related data stays consistent without orphaned rows.
- **`mysql2/promise`:** A high-performance MySQL driver that allows us to write clean `async/await` queries with native connection pooling and 100% parameterized queries to protect against SQL Injection.
- **`bcryptjs`:** Used to hash all passwords with 10 salt rounds before storing them in the database. Raw passwords and hashes are never exposed in API responses.
- **`jsonwebtoken` (JWT):** Generates signed tokens containing user identity and role claims, enabling stateless authentication across requests.

### Frontend
- **React 19 + Vite:** Vite gives us an ultra-fast developer environment and optimized production builds. React 19 provides responsive, state-driven user interfaces.
- **React Router v6:** Powers client-side navigation with route guards (`ProtectedRoute`, `PublicOnlyRoute`) that block unauthorized roles before pages even load.
- **Axios:** Handles HTTP requests with request interceptors (attaching JWT Bearer tokens) and response interceptors (handling global 401 unauthorized logouts).
- **Pure Vanilla CSS Design System:** Instead of generic Tailwind utilities, we engineered a custom Vanilla CSS system with CSS variables, light theme palettes, responsive layout containers, and sharp corners.
- **Lucide React:** Clean, consistent vector icons across the interface.

---

## 👥 Role Capabilities & Core Functionalities

The platform is divided into three distinct user roles, each with custom dashboards and permissions:

### 1. Normal User (Customer)
- **Store Directory & Live Search:** Customers can explore physical stores across major Indian cities, search in real-time by store name or address, and sort results by rating or date.
- **Interactive Star Rating:** Customers can rate any store from 1 to 5 stars. If they've already rated a store, they can modify their rating in-place with instant visual feedback.
- **"My Ratings" View:** A dedicated section where customers can review all the stores they have rated in the past.
- **Two-Column Notebook Registration:** A notebook-inspired signup screen with a real-time password complexity checklist that turns from red to green as criteria are satisfied.

### 2. Store Owner (Merchant)
- **Self-Serve Store & Owner Onboarding (`/register-store`):** New business owners can register both their store details and their owner credentials in a single atomic form.
- **Store Owner Dashboard:** View aggregate satisfaction scores and total review counts across all owned stores.
- **Tabular Customer Feedback Breakdown:** Owners can click on any of their stores to view a detailed table of customer feedback containing customer names, emails, star scores, and submission dates.
- **Search & Filters for Reviews:** Store owners can filter reviews by customer name, email address, or specific star rating (5★, 4★, 3★, etc.) and sort by any column.
- **In-Dashboard Store Expansion:** Owners can register additional store locations directly from their dashboard using the "Add New Store" button.
- **Anti-Fraud Guard:** Store owners are strictly forbidden from rating their own stores or competing stores.

### 3. System Administrator
- **Platform Analytics Dashboard:** Real-time summary counters tracking Total Registered Users, Total Stores, and Total Submitted Reviews across the platform.
- **User Account Management:** Search, filter by role (`admin`, `owner`, `user`), sort, and create new user accounts with any assigned privilege.
- **Store Registry:** Register new stores, assign them to verified store owners, and monitor all business listings across India.
- **Role Isolation:** System administrators focus purely on platform governance and cannot submit ratings.

---

## 🎨 UI & UX Design Highlights

- **Modern Light Theme:** Built with crisp white surfaces (`#ffffff`), subtle canvas backgrounds (`#f8fafc`), and slate neutral borders (`#e2e8f0`).
- **Strict Sharp Edges (0px Radii):** A distinctive, modern aesthetic with sharp corners across cards, buttons, inputs, tables, and modal dialogs.
- **Left-Aligned Vertical Sidebar:** Pinned navigation menu on the left side with categorized sections and clear active indicator states.
- **Top Header Bar with Profile Avatar:** Houses the user avatar, name, role badge, and account menu dropdown (*My Profile*, *Change Password*, *Sign Out*).
- **Live Password Complexity Checklist:** Functional visual cues that switch from red `✕` to green `✓` in real-time as users type compliant passwords.

---

## 🛡️ Engineering & Security Highlights

1. **Atomic Database Transactions:** Multi-step operations (like creating an owner account and their store simultaneously) run inside atomic MySQL transactions (`beginTransaction` / `commit` / `rollback`) to prevent partial data writes.
2. **Race-Condition Proof Ratings:** Ratings use an atomic `INSERT ... ON DUPLICATE KEY UPDATE` query over a `UNIQUE(user_id, store_id)` composite index.
3. **Cartesian-Safe Calculations:** Rating averages use derived-table subqueries to prevent row duplication when joining stores with ratings.
4. **Input Length & Complexity Constraints:** Strict validations enforce 20–60 character name limits, 400 character address limits, and 8–16 character password complexity with uppercase and special character requirements.

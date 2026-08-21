# Roxiler Systems — Testing & Demo Credentials

This document contains all pre-configured demo user accounts, authentication rules, role permissions, and testing workflows for the **Roxiler Systems Store Rating & Management Platform**.

---

## 📋 Comprehensive Accounts Table

| # | Role | Name | Email | Password | Access Scope | Location |
|---|---|---|---|---|---|---|
| **1** | **System Administrator** | Aarav Sharma - System Admin | `admin@roxiler.com` | `Admin@1234` | `/admin/*` (All Platform Controls) | Gurugram, HR |
| **2** | **System Administrator** | Priya Patel - Operations Lead | `priya.admin@roxiler.com` | `Admin@5678` | `/admin/*` (All Platform Controls) | Hyderabad, TS |
| **3** | **Store Owner** | Rajesh Kumar - Merchant Owner | `owner@store.com` | `Owner@1234` | `/owner/dashboard` (Store Analytics) | Bengaluru, KA |
| **4** | **Store Owner** | Ananya Deshmukh - Merchant Owner | `ananya.owner@store.com` | `Owner@5678` | `/owner/dashboard` (Store Analytics) | Pune, MH |
| **5** | **Store Owner** | Vikram Malhotra - Merchant Owner | `vikram.owner@store.com` | `Owner@9012` | `/owner/dashboard` (Store Analytics) | New Delhi, DL |
| **6** | **Customer (User)** | Amitabh Sen - Verified Customer | `user@example.com` | `User@1234` | `/stores`, `/user/ratings` | Kolkata, WB |
| **7** | **Customer (User)** | Rohit Verma - Verified Customer | `rohit.customer@example.com` | `User@1234` | `/stores`, `/user/ratings` | Noida, UP |
| **8** | **Customer (User)** | Sneha Reddy - Verified Customer | `sneha.customer@example.com` | `User@5678` | `/stores`, `/user/ratings` | Hyderabad, TS |
| **9** | **Customer (User)** | Pooja Sharma - Verified Customer | `pooja.customer@example.com` | `User@9012` | `/stores`, `/user/ratings` | Mumbai, MH |

> [!NOTE]
> All passwords are **case-sensitive** and comply with the platform's password validation rules (8–16 characters, at least 1 uppercase letter, and at least 1 special character).

---

## 🏬 Pre-Seeded Store Directory

| Store ID | Store Business Name | Business Contact Email | Physical Location | Assigned Owner | Initial Ratings |
|---|---|---|---|---|---|
| **1** | FabIndia Heritage Crafts & Apparel | `contact@fabindiaheritage.com` | Indiranagar, Bengaluru, KA | Rajesh Kumar (`owner@store.com`) | 3 Reviews (4.7 ★) |
| **2** | Nature's Basket Organic Supermarket | `support@naturesbasketgroceries.com` | Bandra West, Mumbai, MH | Ananya Deshmukh (`ananya.owner@store.com`) | 2 Reviews (4.5 ★) |
| **3** | Chai Point Express Café & Bakery | `orders@chaipointexpress.com` | Brigade Road, Bengaluru, KA | Rajesh Kumar (`owner@store.com`) | 2 Reviews (4.5 ★) |
| **4** | Crossword Bookstore & Café Lounge | `service@crosswordbooks.com` | SB Road, Pune, MH | Ananya Deshmukh (`ananya.owner@store.com`) | 2 Reviews (4.5 ★) |
| **5** | Haldiram's Sweets & Pure Veg Restaurant | `delhi@haldiramsdelhi.com` | Connaught Place, New Delhi, DL | Vikram Malhotra (`vikram.owner@store.com`) | 3 Reviews (4.7 ★) |
| **6** | Croma Electronics & Home Appliances | `support@cromadigital.com` | Gachibowli, Hyderabad, TS | Vikram Malhotra (`vikram.owner@store.com`) | 2 Reviews (4.0 ★) |
| **7** | Titan World Watches & Eyewear Studio | `care@titanworldstores.com` | MG Road, Kochi, KL | Rajesh Kumar (`owner@store.com`) | 2 Reviews (4.5 ★) |

---

## 👥 Role Profiles & Capabilities

### 1. System Administrator
- **Primary Accounts:** `admin@roxiler.com` (`Admin@1234`), `priya.admin@roxiler.com` (`Admin@5678`)
- **Primary Scope:** `/admin/dashboard`, `/admin/users`, `/admin/stores`
- **Permitted Operations:**
  - 📊 **Platform Overview:** Real-time counters for Total Registered Users, Total Stores, and Total Submitted Ratings.
  - 👥 **User Management:** View, search (by Name, Email, Address), filter (by Role: `admin`, `owner`, `user`), sort, and create user accounts with any role.
  - 🏬 **Store Management:** Register new stores and assign them to existing store owners.

---

### 2. Store Owner
- **Primary Accounts:** `owner@store.com` (`Owner@1234`), `ananya.owner@store.com` (`Owner@5678`), `vikram.owner@store.com` (`Owner@9012`)
- **Primary Scope:** `/owner/dashboard`
- **Permitted Operations:**
  - 📈 **Store Performance Analytics:** View average ratings and total review counts for owned stores.
  - 💬 **Customer Review Audit:** View the tabular feedback list of customers who rated the store (Customer Name, Email, Rating Score, Submission Date) with live name/email search, star filters, and sorting.
  - ➕ **In-Dashboard Store Addition:** Register new store locations directly using the **"Add New Store"** button.
  - 🔒 **Role Guard:** Restricted from rating stores or accessing admin controls.

---

### 3. Normal User (Customer)
- **Primary Accounts:** `user@example.com`, `rohit.customer@example.com`, `sneha.customer@example.com`, `pooja.customer@example.com`
- **Primary Scope:** `/stores`, `/user/ratings`
- **Permitted Operations:**
  - 🔍 **Store Directory:** Search stores by Name or Address with live debounced search and sorting.
  - ⭐ **Submit & Modify Ratings:** Submit 1 to 5-star ratings or update existing ratings with instant visual feedback.
  - 📋 **My Ratings:** Filter and manage all stores rated by the logged-in customer.

---

## 🔐 Validation Constraints

| Field | Length / Format | Allowed Characters |
|---|---|---|
| **Full Name** | 20 to 60 characters | Standard alphanumeric and spaces |
| **Email Address** | RFC 5322 standard format | Valid email (`user@domain.com`) |
| **Physical Address** | Maximum 400 characters | Alphanumeric, punctuation, commas |
| **Password** | 8 to 16 characters | At least 1 uppercase letter (`A-Z`) & at least 1 special char (`!@#$%^&*...`) |

---

## 🔄 Database Re-Seeding

To reset the database with this clean Indian demo dataset, run:

```bash
# From the project root:
npm run init-db

# Or with force re-seed directly:
cd server
node src/config/initDb.js --force
```

# 🍽️ QuickDine — Full Stack Restaurant Reservation Platform

<div align="center">

![QuickDine Banner](./frontend/public/logo.svg)

**A premium, production-grade MERN stack restaurant booking platform with real-time seat availability, JWT authentication, and dynamic search filtering.**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

[Live Demo](#) · [Backend API Docs](#-api-reference) · [Report Bug](https://github.com/SujalDeshmukh/quickdine/issues)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Folder Structure](#-folder-structure)
- [API Reference](#-api-reference)
- [Key Features](#-key-features)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)

---

## 🌟 Overview

QuickDine solves the **double-booking problem** that plagues traditional restaurant reservation systems. It implements **server-side, real-time capacity validation** using array aggregations (`.reduce()`) ensuring that the total confirmed booked seats for any time slot never exceed a restaurant's total seating capacity — preventing overbooking even under concurrent requests.

> Built as a full-stack monorepo with a **React 19 + Vite** frontend and a **Node.js + Express + MongoDB** REST API backend, both written in **TypeScript**.

---

## 🏗️ System Architecture

```mermaid
graph TB
    subgraph CLIENT["🌐 Client Layer (React + TypeScript + Vite)"]
        UI["React 19 UI Components"]
        CTX["AppContext (Global Auth State)"]
        AX["Axios HTTP Client"]
    end

    subgraph API["⚙️ API Layer (Express + TypeScript)"]
        MW["auth.ts Middleware\n(JWT Bearer Token Guard)"]
        AR["Auth Routes\nPOST /api/auth/register\nPOST /api/auth/login\nGET  /api/auth/me"]
        RR["Restaurant Routes\nGET /api/restaurants\nGET /api/restaurants/featured\nGET /api/restaurants/:slug\nGET /api/restaurants/:id/availability"]
        BR["Booking Routes\nPOST /api/bookings\nGET  /api/bookings/my\nGET  /api/bookings/:id\nPATCH /api/bookings/:id/cancel"]
    end

    subgraph CTRL["🧠 Controller Layer"]
        AC["authController\nregister · login · getMe"]
        RC["restaurantController\nSearch · Slug · Availability\n(.reduce() capacity calc)"]
        BC["bookingController\nCreate · List · Cancel\n(Double-booking prevention)"]
    end

    subgraph DB["🗄️ Data Layer (MongoDB + Mongoose)"]
        UM["User Model\nbcrypt pre-save hook\nselect:false password"]
        RM["Restaurant Model\nText Index for search\nSlug · Slots · TotalSeats"]
        BM["Booking Model\nAuto bookingId GR-XXXXXXXX\nCompound Index: restaurant+date+time"]
    end

    UI --> CTX
    CTX --> AX
    AX -->|"HTTP Request + Bearer Token"| MW
    MW -->|"req.user injected"| AR & RR & BR
    AR --> AC
    RR --> RC
    BR --> BC
    AC --> UM
    RC --> RM & BM
    BC --> BM & RM
    DB -->|"Mongoose Documents"| CTRL
    CTRL -->|"JSON Response"| CLIENT
```

---

### 🔐 Authentication & Session Flow

```mermaid
sequenceDiagram
    participant Browser
    participant AppContext
    participant ExpressAPI
    participant MongoDB

    Browser->>AppContext: User clicks Sign Up / Sign In
    AppContext->>ExpressAPI: POST /api/auth/register or /login
    ExpressAPI->>MongoDB: findOne({ email }) + bcrypt.compare()
    MongoDB-->>ExpressAPI: User document
    ExpressAPI-->>AppContext: { token, user } (JWT signed)
    AppContext->>Browser: Store token in localStorage

    Note over Browser,ExpressAPI: On every page refresh...

    Browser->>AppContext: useEffect fires on load
    AppContext->>ExpressAPI: GET /api/auth/me (Authorization: Bearer token)
    ExpressAPI->>MongoDB: User.findById(decoded.id)
    MongoDB-->>ExpressAPI: User document
    ExpressAPI-->>AppContext: { user } restored
    AppContext->>Browser: Session restored silently ✅
```

---

### ⚡ Real-Time Slot Availability Flow

```mermaid
sequenceDiagram
    participant Customer
    participant ReactUI
    participant ExpressAPI
    participant MongoDB

    Customer->>ReactUI: Selects date on RestaurantDetail page
    ReactUI->>ExpressAPI: GET /api/restaurants/:id/availability?date=2026-08-20
    ExpressAPI->>MongoDB: Find all CONFIRMED bookings (restaurant + date)
    MongoDB-->>ExpressAPI: [{time:"19:00", guests:4}, {time:"19:00", guests:2}]

    Note over ExpressAPI: .reduce() per slot:<br/>bookedSeats = bookings.reduce((acc, b) => acc + b.guests, 0)<br/>availableSeats = totalSeats - bookedSeats

    ExpressAPI-->>ReactUI: [{time:"18:00", availableSeats:45}, {time:"19:00", availableSeats:39}]
    ReactUI->>Customer: Displays live seat counts per slot ✅

    Customer->>ReactUI: Clicks "Reserve Table"
    ReactUI->>ExpressAPI: POST /api/bookings { restaurantId, date, time, guests:4 }
    ExpressAPI->>MongoDB: Re-validate capacity (prevents race conditions!)
    MongoDB-->>ExpressAPI: Current confirmed bookings
    Note over ExpressAPI: If totalBooked + newGuests > totalSeats → 409 Conflict
    ExpressAPI-->>ReactUI: 201 Created { bookingId: "GR-71B448A7" }
    ReactUI->>Customer: Shows Booking Success screen ✅
```

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19 + Vite | Component-driven UI with instant HMR dev experience |
| **Frontend Language** | TypeScript | Strict type safety across component props and API contracts |
| **Styling** | Tailwind CSS v4 | Utility-first, responsive design with custom luxury theme |
| **HTTP Client** | Axios | Interceptors, default headers, and clean error handling |
| **Routing** | React Router v7 | Client-side routing with protected route guards |
| **Backend Framework** | Express.js | Minimal, flexible REST API with middleware composition |
| **Backend Language** | TypeScript | End-to-end type safety including Mongoose schemas |
| **Database** | MongoDB | Flexible NoSQL documents for nested schemas (tags, slots arrays) |
| **ODM** | Mongoose | Schema validation, indexes, and pre-save middleware hooks |
| **Authentication** | JWT + bcryptjs | Stateless auth tokens, salted password hashing (12 rounds) |
| **Runtime** | Node.js | Non-blocking I/O for concurrent reservation handling |

---

## 📁 Folder Structure

```
quickdine/                          ← Monorepo Root
│
├── frontend/                       ← React + TypeScript + Vite
│   ├── public/                     ← Static assets (restaurant images, logo)
│   ├── src/
│   │   ├── assets/assets.ts        ← Shared constants & dummy fallback data
│   │   ├── components/
│   │   │   ├── AuthModal.tsx        ← Sign In / Sign Up modal
│   │   │   ├── Navbar.tsx           ← Top navigation with user dropdown
│   │   │   ├── RestaurantCard.tsx   ← Restaurant discovery card
│   │   │   ├── booking/             ← BookingForm, BookingSummary, BookingSuccess
│   │   │   └── restaurant/          ← BookingWidget, RestaurantHero, RestaurantInfo
│   │   ├── context/
│   │   │   └── AppContext.tsx       ← Global auth state, login, register, logout
│   │   └── pages/
│   │       ├── Home.tsx             ← Landing page with featured restaurants
│   │       ├── Search.tsx           ← Dynamic search & filter page
│   │       ├── RestaurantDetail.tsx ← Detail view + real-time slot picker
│   │       ├── BookingConfirmation.tsx ← Reservation form & confirmation
│   │       └── Dashboard.tsx        ← My Bookings (upcoming + history + cancel)
│   ├── package.json
│   └── vite.config.ts
│
└── backend/                        ← Node.js + Express + TypeScript
    ├── src/
    │   ├── config/
    │   │   └── db.ts               ← MongoDB connection (fail-fast pattern)
    │   ├── models/
    │   │   ├── user.ts             ← User schema (bcrypt hook, select:false)
    │   │   ├── restaurant.ts       ← Restaurant schema (slug, slots, text index)
    │   │   └── booking.ts          ← Booking schema (auto bookingId, compound index)
    │   ├── controllers/
    │   │   ├── authController.ts   ← register, login, getMe
    │   │   ├── restaurantController.ts ← Search, slug, .reduce() availability
    │   │   └── bookingController.ts ← createBooking (capacity guard), list, cancel
    │   ├── middlewares/
    │   │   └── auth.ts             ← JWT protect guard → injects req.user
    │   ├── routes/
    │   │   ├── authRoutes.ts
    │   │   ├── restaurantRoutes.ts
    │   │   └── bookingRoutes.ts
    │   ├── seed.ts                 ← Database seeder (6 sample restaurants)
    │   └── server.ts               ← Express app entry point
    ├── .env.example
    ├── package.json
    └── tsconfig.json
```

---

## 🔌 API Reference

### 🔑 Authentication — `/api/auth`

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Create a new customer account |
| `POST` | `/api/auth/login` | Public | Authenticate user, receive JWT |
| `GET` | `/api/auth/me` | 🔐 Private | Get current user profile (session restore) |

### 🏪 Restaurants — `/api/restaurants`

| Method | Endpoint | Access | Query Params | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/restaurants` | Public | `search`, `location`, `cuisine`, `priceRange`, `sort` | Search all approved restaurants |
| `GET` | `/api/restaurants/featured` | Public | — | Top-rated featured restaurants |
| `GET` | `/api/restaurants/:slug` | Public | — | Single restaurant by URL slug |
| `GET` | `/api/restaurants/:id/availability` | Public | `date` (YYYY-MM-DD) | Real-time per-slot seat availability |

### 📅 Bookings — `/api/bookings`

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/bookings` | 🔐 Private | Create reservation (with `.reduce()` capacity validation) |
| `GET` | `/api/bookings/my` | 🔐 Private | All bookings for the logged-in user |
| `GET` | `/api/bookings/:id` | 🔐 Private | Single booking (ownership-checked) |
| `PATCH` | `/api/bookings/:id/cancel` | 🔐 Private | Cancel a confirmed booking |

---

## ✨ Key Features

- 🔒 **Secure Authentication** — JWT stateless auth with bcrypt password hashing (12 salt rounds). Password field hidden with `select: false` — never leaked in API responses.
- ⚡ **Real-Time Capacity Engine** — Uses JavaScript's `.reduce()` to dynamically calculate remaining seats per slot, ensuring bookings never exceed `restaurant.totalSeats`.
- 🛡️ **Double-Booking Guard** — Server re-validates capacity on every `POST /api/bookings` request, preventing race conditions under concurrent traffic.
- 🔍 **Full-Text Search** — MongoDB text indexes across `name`, `cuisine`, `location`, and `tags` for fast search-as-you-type filtering.
- 🆔 **Auto Reference Numbers** — Mongoose `pre('save')` hook generates unique human-readable booking IDs (e.g., `GR-71B448A7`).
- 🛡️ **Ownership Guards** — `Booking.findOne({ _id, user })` pattern prevents customers from accessing or cancelling other users' bookings.
- 📱 **Fully Responsive** — Mobile-first layout with a dedicated slide-in filter drawer for small screens.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+
- **MongoDB** (local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- **Git**

### 1. Clone the Repository

```bash
git clone https://github.com/SujalDeshmukh/quickdine.git
cd quickdine
```

### 2. Setup Backend

```bash
cd backend

# Create environment file
cp .env.example .env
# Edit .env and fill in your MONGODB_URI and JWT_SECRET

# Install dependencies
npm install

# Seed the database with 6 sample restaurants
npm run seed

# Start development server
npm run dev
# Backend runs at http://localhost:5000
```

### 3. Setup Frontend

```bash
cd ../frontend

# Install dependencies
npm install

# Start development server
npm run dev
# Frontend runs at http://localhost:5173
```

### 4. Open in Browser

Navigate to **[http://localhost:5173](http://localhost:5173)** and test the full customer journey:

1. **Register** a new account via Sign Up modal.
2. **Browse** restaurants on the Search page.
3. **Select a date** on a restaurant's detail page to see real-time slot availability.
4. **Book a table** and receive a confirmation with a unique booking reference.
5. **View and cancel** reservations from the Dashboard.

---

## 🌍 Environment Variables

### Backend (`backend/.env`)

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/quickdine   # Or your Atlas URI
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

> ⚠️ **Never commit your `.env` file!** It is listed in `.gitignore`. Use `.env.example` as a reference template.

---

## 👨‍💻 Author

**Sujal Deshmukh**

[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/SujalDeshmukh)

---

<div align="center">

Made with ❤️ using the MERN Stack

</div>

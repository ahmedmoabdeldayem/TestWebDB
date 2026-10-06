# ShopHub — Learning Project

A full-stack e-commerce web app built to practise connecting a React frontend to an Express REST API backed by an encrypted SQLite database.

> **This is a learning project.** It is not intended for production use. The goal was to understand how authentication, JWTs, database encryption, and REST API design work together in a real app.

## What I Learned Building This

- **JWT authentication** — stateless login using httpOnly cookies, signed tokens, and a middleware guard on protected routes
- **Password security** — bcrypt hashing with cost factor 12, constant-time comparison to prevent timing attacks, generic error messages to prevent email enumeration
- **Database encryption** — SQLite encrypted at rest using SQLCipher via `better-sqlite3-multiple-ciphers`
- **API security** — Helmet headers, CORS config, rate limiting (200 req/15 min per IP), payload size limits
- **React patterns** — Context API for auth and cart state, React Router v7 for navigation, component composition

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, React Router v7, Vite |
| Backend | Node.js, Express 5 |
| Database | SQLite (encrypted with SQLCipher) |
| Auth | JWT (jsonwebtoken) + bcryptjs |

## Project Structure

```
ShopHub/
├── frontend/          # React app (Vite)
│   └── src/
│       ├── pages/     # Home, Login, Register, Cart, Checkout, Orders, ProductDetail
│       ├── components/
│       └── context/   # AuthContext, CartContext
│
└── backend/           # Express REST API
    └── src/
        ├── controllers/   # authController, productController, cartController, orderController
        ├── middleware/    # JWT auth guard
        ├── models/        # db.js — SQLite connection + schema init
        └── routes/        # /api/auth, /api/products, /api/cart, /api/orders
```

## Running Locally

### 1. Set up environment

```bash
cp backend/.env.example backend/.env
# Edit backend/.env and generate real secrets:
#   JWT_SECRET:        node -e "require('crypto').randomBytes(64).toString('hex')"
#   DB_ENCRYPTION_KEY: node -e "require('crypto').randomBytes(32).toString('hex')"
```

### 2. Install and run

```bash
npm install
npm run install:all
npm run dev        # starts both backend (port 5001) and frontend (port 5173)
```

### 3. Seed the database

```bash
cd backend && node src/seed/products.js
```

Open **http://localhost:5173** — register an account and explore.

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Register new user |
| POST | `/api/auth/login` | — | Login |
| POST | `/api/auth/logout` | — | Logout |
| GET | `/api/auth/me` | ✓ | Current user |
| GET | `/api/products` | — | List products |
| GET | `/api/products/:id` | — | Product detail |
| GET | `/api/cart` | ✓ | Get cart |
| POST | `/api/cart` | ✓ | Add to cart |
| DELETE | `/api/cart/:id` | ✓ | Remove from cart |
| GET | `/api/orders` | ✓ | Order history |
| POST | `/api/orders` | ✓ | Place order |

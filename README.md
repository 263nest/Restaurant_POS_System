# 🍽️ Restaurant POS System

A full-stack Restaurant POS System designed to manage orders, tables, payments, and staff metrics through a React frontend and Express/MongoDB backend.

## 🧩 Project Overview

This repository contains two main applications:

- `pos-backend`: Node.js + Express API server
- `pos-frontend`: React.js + Redux client app

The application supports role-based authentication, waiter metrics, cashier dashboards, table management, and payment processing.

## 🏗️ Core Technologies

- Frontend: React, React Router, Redux Toolkit, Tailwind CSS
- Backend: Node.js, Express, Mongoose
- Database: MongoDB
- Auth: JWT, bcrypt
- Payments: MPESA STK Push integration
- HTTP client: Axios

---

## 📁 Repository Structure

### Backend (`pos-backend`)

- `app.js` — main server bootstrap, middleware, route registration
- `config/` — database and environment configuration
- `controllers/` — request handlers for users, orders, tables, payments
- `models/` — Mongoose schemas for `User`, `Order`, `Table`, `Payment`
- `routes/` — router definitions for `/api/user`, `/api/order`, `/api/table`, `/api/payment`
- `middlewares/` — authentication, authorization, and error handling

### Frontend (`pos-frontend`)

- `src/App.jsx` — app routing and protected route flow
- `src/pages/` — main UI pages: `Auth`, `Home`, `Orders`, `Tables`, `Menu`, `Dashboard`
- `src/https/` — API helper functions and Axios wrapper
- `src/redux/` — Redux store and slices
- `src/hooks/` — data-loading hook for user session
- `src/components/` — reusable UI components

---

## 🚀 Setup & Run

### Backend

1. Copy `.env.example` or create `.env` in `pos-backend`
2. Set values for:
   - `PORT`
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `MPESA_CONSUMER_KEY`
   - `MPESA_CONSUMER_SECRET`
   - `MPESA_BUSINESS_SHORT_CODE`
   - `MPESA_PASS_KEY`
   - `MPESA_CALLBACK_URL`
3. Install packages:
   ```bash
   cd pos-backend
   npm install
   ```
4. Run server:
   ```bash
   npm run dev
   ```

### Frontend

1. Create `.env` in `pos-frontend`
2. Set:
   - `VITE_BACKEND_URL=http://localhost:3000`
3. Install packages:
   ```bash
   cd pos-frontend
   npm install
   ```
4. Run the app:
   ```bash
   npm run dev
   ```

---

## 🔐 Backend Functionality

### `app.js`

- Connects to MongoDB
- Enables CORS for `http://localhost:5173`
- Uses `express.json()` and `cookie-parser`
- Mounts routes:
  - `/api/user`
  - `/api/order`
  - `/api/table`
  - `/api/payment`
- Applies `globalErrorHandler`

### Authentication

#### `userController.js`

- `register(req, res, next)`
  - Validates required fields: `name`, `phone`, `email`, `password`, `role`
  - Prevents duplicate users by email
  - Saves new user with bcrypt-hashed password
  - Returns created user details

- `login(req, res, next)`
  - Validates `email` and `password`
  - Checks credentials against stored user
  - Generates JWT access token valid for 1 day
  - Stores token in an HTTP-only cookie

- `getUserData(req, res, next)`
  - Returns profile of logged-in user based on JWT cookie

- `logout(req, res, next)`
  - Clears `accessToken` cookie
  - Returns logout confirmation

#### `middlewares/tokenVerification.js`

- `isVerifiedUser`
  - Validates JWT from cookie
  - Loads user from DB and attaches `req.user`

- `isAdminOrCashier`
  - Allows only users with `role` equal to `admin` or `cashier`
  - Protects cashier-only dashboards and transaction data

### Order Management

#### `orderController.js`

- `addOrder(req, res, next)`
  - Creates a new `Order` document with data from request body
  - Attaches `createdBy` from authenticated user

- `getOrderById(req, res, next)`
  - Validates order `id`
  - Returns matching order or 404 if missing

- `getOrders(req, res, next)`
  - Fetches all orders and populates table reference

- `updateOrder(req, res, next)`
  - Updates order status by ID
  - Returns updated order

- `getWaiterMetrics(req, res, next)`
  - Computes metrics for the authenticated waiter:
    - total orders
    - unique customers
    - total earnings
  - Uses orders created by the waiter

- `getCashierDashboard(req, res, next)`
  - Retrieves today’s orders and payments
  - Computes:
    - total / completed / in-progress / pending orders
    - total order sales
    - payment totals and method breakdown
    - successful vs failed payments

#### `orderRoute.js`

- `POST /api/order/` → `addOrder`
- `GET /api/order/` → `getOrders`
- `GET /api/order/:id` → `getOrderById`
- `PUT /api/order/:id` → `updateOrder`
- `GET /api/order/metrics/waiter` → `getWaiterMetrics`
- `GET /api/order/dashboard/cashier` → `getCashierDashboard`

### Table Management

#### `tableController.js`

- `addTable(req, res, next)`
  - Adds a new table with `tableNo` and `seats`
  - Rejects duplicates by `tableNo`

- `getTables(req, res, next)`
  - Returns all tables
  - Populates `currentOrder` customer details

- `updateTable(req, res, next)`
  - Updates table `status` and `currentOrder`
  - Validates table ID

#### `tableRoute.js`

- `POST /api/table/` → `addTable`
- `GET /api/table/` → `getTables`
- `PUT /api/table/:id` → `updateTable`

### Payment Processing

#### `paymentController.js`

- `createOrder(req, res, next)`
  - Starts MPESA STK Push payment request
  - Requires `amount` and `phoneNumber`
  - Converts phone format to `254XXXXXXXXX`
  - Uses MPESA sandbox token generation and push endpoints

- `verifyPayment(req, res, next)`
  - Checks payment result from request body
  - Currently validates by `resultCode` only

- `webHookVerification(req, res, next)`
  - Receives MPESA callbacks
  - Logs webhook payload and parses payment metadata
  - Intended to save completed payments to DB

- `getDayTransactions(req, res, next)`
  - Fetches today’s payment records
  - Returns totals for successful, failed, pending transactions

#### `paymentRoute.js`

- `POST /api/payment/create-order` → `createOrder`
- `POST /api/payment/verify-payment` → `verifyPayment`
- `POST /api/payment/webhook-verification` → `webHookVerification`
- `GET /api/payment/day-transactions` → `getDayTransactions`

### Data Models

#### `User`

- `name`, `email`, `phone`, `password`, `role`
- Password is hashed in `pre('save')`

#### `Order`

- `customerDetails`:
  - `name`, `phone`, `guests`
- `orderStatus`, `orderDate`
- `bills`: `total`, `tax`, `totalWithTax`
- `items`, `table`, `paymentMethod`, `paymentData`
- `createdBy` references `User`

#### `Table`

- `tableNo`, `status`, `seats`, `currentOrder`

#### `Payment`

- `paymentId`, `orderId`, `amount`, `currency`, `status`, `method`, `email`, `contact`, `createdAt`

---

## 🖥️ Frontend Functionality

### `src/App.jsx`

- Defines the application router and protected pages
- Uses `ProtectedRoutes` to redirect unauthenticated users to `/auth`
- Hides header on auth page only
- Page routes:
  - `/` → `Home`
  - `/auth` → `Auth`
  - `/orders` → `Orders`
  - `/tables` → `Tables`
  - `/menu` → `Menu`
  - `/dashboard` → `Dashboard`

### `src/https/axiosWrapper.js`

- Creates Axios instance with:
  - `baseURL` from `VITE_BACKEND_URL`
  - `withCredentials: true`
  - JSON headers

### `src/https/index.js`

API wrapper functions exposed to pages and components:

- Auth
  - `login(data)`
  - `register(data)`
  - `getUserData()`
  - `logout()`
- Table
  - `addTable(data)`
  - `getTables()`
  - `updateTable({ tableId, ...tableData })`
- Order
  - `addOrder(data)`
  - `getOrders()`
  - `updateOrderStatus({ orderId, orderStatus })`
  - `getWaiterMetrics()`
- Payment
  - `createOrderRazorpay(data)`
  - `verifyPaymentRazorpay(data)`

### `src/hooks/useLoadData.js`

- Loads the authenticated user when the app starts
- Calls `getUserData()`
- Stores user info in Redux via `setUser`
- If load fails, clears user state with `removeUser`

### `src/redux/slices/userSlice.js`

- Stores authenticated user info
- Tracks `isAuth` state
- Reducers:
  - `setUser` sets user profile and authentication flag
  - `removeUser` clears auth state

### Page Responsibilities

- `Auth.jsx` — login/register flow
- `Home.jsx` — likely dashboard overview and restaurant actions
- `Orders.jsx` — order list, status updates, order details
- `Tables.jsx` — table management and seating assignments
- `Menu.jsx` — menu browsing and cart interactions
- `Dashboard.jsx` — admin/cashier analytics and performance metrics

---

## 🧠 How the Main Flows Work

### Authentication Flow

1. User registers or logs in using `/api/user/register` or `/api/user/login`
2. Backend returns JWT in `accessToken` cookie
3. Frontend calls `getUserData()` to populate Redux user state
4. Protected routes require `isAuth` and redirect to `/auth` when not logged in

### Order Creation Flow

1. Frontend submits order details to `POST /api/order/`
2. Backend saves order with `createdBy` set to current user
3. Orders are fetched with `GET /api/order/`
4. Order status updates via `PUT /api/order/:id`

### Table Management Flow

1. Add new table via `POST /api/table/`
2. Fetch all tables via `GET /api/table/`
3. Update table occupancy and current order via `PUT /api/table/:id`

### Payment Flow

1. Payment request is sent to `POST /api/payment/create-order`
2. Backend initiates MPESA STK Push using sandbox APIs
3. Payment verification is accepted by `POST /api/payment/verify-payment`
4. Webhook callbacks can be received at `/api/payment/webhook-verification`

### Metrics & Dashboard Flow

- Waiter dashboard uses `/api/order/metrics/waiter`
- Cashier dashboard uses `/api/order/dashboard/cashier`
- Daily payment summaries use `/api/payment/day-transactions`

---

## 💡 Notes

- MPESA is currently used for payment flows instead of Razorpay.
- The backend uses environment variables for secrets and external API configuration.
- The frontend requires `VITE_BACKEND_URL` so axios requests reach the backend.

---

## 📌 Contribution

Contributions are welcome. Please review `CONTRIBUTING.md` for guidelines and branch strategy.

## 📄 License

This project is licensed under the terms in `LICENSE`.

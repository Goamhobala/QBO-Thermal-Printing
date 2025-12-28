# QBO Thermal Printing

A simple web application for creating QuickBooks Online invoices and printing 80mm thermal receipts for Timber 4 U CC.

## Tech Stack

- **Backend:** Node.js + Express + TypeScript
- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **QBO Integration:** intuit-oauth SDK

## Project Structure

```
QBO-ThermalPrinting/
├── backend/              # Express API server
│   ├── src/
│   │   ├── qbo-client.ts    # QuickBooks OAuth setup
│   │   ├── routes.ts        # API routes (customers, items, invoices)
│   │   └── server.ts        # Express app
│   ├── package.json
│   └── tsconfig.json
├── frontend/             # React app
│   ├── src/
│   │   ├── CreateInvoice.tsx     # Main invoice form
│   │   ├── api.ts                # Backend API calls
│   │   ├── types.ts              # TypeScript types
│   │   ├── thermal-template.html # 80mm receipt template
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
└── docs/                 # Documentation
```

## Setup Instructions

### Prerequisites

- Node.js 18+ installed
- QuickBooks Online Developer account
- QuickBooks app credentials (Client ID & Secret)

### 1. Clone & Install

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment Variables

**Backend** (`backend/.env`):
```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your QuickBooks credentials:
```
CLIENT_ID=your_client_id_here
CLIENT_SECRET=your_client_secret_here
REDIRECT_URI=http://localhost:3000/callback
ENVIRONMENT=sandbox
PORT=3000
```

**Frontend** (`frontend/.env`):
```bash
cp frontend/.env.example frontend/.env
```

### 3. Run Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3000

## QuickBooks Setup

1. Create app at https://developer.intuit.com
2. Get Client ID and Client Secret
3. Set Redirect URI to `http://localhost:3000/callback`
4. Add scopes: `com.intuit.quickbooks.accounting`

## Features

- ✅ OAuth authentication with QuickBooks Online
- ✅ Fetch customers from QBO
- ✅ Fetch inventory items from QBO
- ✅ Create invoices in QBO
- ✅ Print 80mm thermal receipts

## API Endpoints

- `GET /api/customers` - Fetch all customers
- `GET /api/items` - Fetch inventory items
- `POST /api/invoices` - Create new invoice

## License

Private - Timber 4 U CC

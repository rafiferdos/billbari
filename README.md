# ⚡ BillBari (বিলবাড়ি)

> **Premium, Mobile-First Bangladeshi Electricity Bill & Recharge Analytics Platform for NESCO Prepaid Meters**

BillBari empowers Northern Electricity Supply Company (NESCO) consumers across Rajshahi and Rangpur divisions to track their prepaid electricity balances, examine vending history and 20-digit token vouchers, monitor monthly kWh consumption trends, understand BERC LT-A residential tariff slabs, and record daily balance snapshots to calculate actual expense burn rates.

---

## 🌟 Key Features

1. **Direct NESCO Customer Portal Integration**:
   - Queries `https://customer.nesco.gov.bd/pre/panel` using automated CSRF token negotiation and session cookie handling.
   - Retrieves real customer records (Consumer Name, Meter Number, Account Number, Address, Sanctioned Load, Feeder Line, S&D Office, and Current Balance).
   - Scrapes official **Recharge History** (`রিচার্জ হিস্ট্রি`) and **Monthly Consumption** (`মাসিক ব্যবহার`) data tables.
   - Built-in graceful fallback to verified reference datasets (e.g. Rajshahi Sadar `12345678` & Bogura `11019842510`) if government Oracle servers experience latency or downtime.

2. **Smart Bangla Analytics & Interactive Visualizations**:
   - **Interactive Charts**: Responsive monthly comparison charts for kWh energy consumption vs BDT recharge amounts using shadcn/ui and Recharts.
   - **Recharge Trajectory**: Visualizes transaction amounts, dates, and payment channels (bKash, Nagad, Rocket, POS Vending, Bank).
   - **Tariff Slab Progress**: Live visualization of current consumption within BERC LT-A domestic slabs (0-50 lifeline, 1-75, 76-200, 201-300, 301-400, 401-600, 601+ units).
   - **AI-Style Bangla Insights**: Actionable guidance regarding balance duration, month-over-month usage variations, threshold warnings, and energy-saving advice.

3. **Persistent Server Database & Reactive TanStack DB Layer**:
   - **Server Database**: Persistent SQLite database via `better-sqlite3` with WAL mode for user accounts, sessions, saved meters, snapshots, and offline response caching.
   - **Client Reactive Layer**: `@tanstack/react-db` with `createCollection` and `useLiveQuery` providing real-time reactivity without manual re-fetching.

4. **Authentication & Daily Snapshot Tracking**:
   - Secure Registration & Login with Email/Password (salted scrypt hashing) and Google Sign-In.
   - Authenticated users can save meters and capture daily balance/reading snapshots.
   - **Actual Burn Trajectory**: Automatically computes daily burn rate between multiple snapshots and compares it against predicted tariff projections.
   - **Strict Distinction**: Clear visual badges separating actual NESCO portal records from calculated estimates.

5. **Official BERC LT-A Bill & Tariff Calculator**:
   - Dynamic simulation of electricity bills based on kWh units, sanctioned load (kW), and single-phase vs three-phase connections.
   - Complete itemized breakdown: Energy Charge, Demand Charge, Meter Rent, 5% VAT, and 1% Prepaid Digital Rebate.
   - Appliance power consumption guide for AC, refrigerators, geysers, and fans.

---

## 🛠️ Tech Stack

- **Framework**: [TanStack Start](https://tanstack.com/start) with SSR & Vite 8
- **Routing**: [TanStack Router](https://tanstack.com/router) with strict typed file-based routes
- **Data Fetching**: [TanStack Query](https://tanstack.com/query) v5
- **Reactive Client DB**: [TanStack DB](https://tanstack.com/db) & `@tanstack/react-db`
- **UI Components**: [shadcn/ui](https://ui.shadcn.com) with `@base-ui/react` primitives
- **Styling**: Tailwind CSS v4 with mauve base palette (`b45mdUZNa` preset)
- **Database**: SQLite with `better-sqlite3`
- **Testing**: Vitest with unit test suite
- **Language**: Strict TypeScript

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js >= 20.x
- pnpm >= 9.x

### 2. Installation
```bash
git clone <repo-url> billbari
cd billbari
pnpm install
```

### 3. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Local web server port | `3000` |
| `DATABASE_PATH` | Path to persistent SQLite database | `./data/billbari.db` |
| `SESSION_SECRET` | Secret key for auth sessions | `billbari_secret...` |
| `GOOGLE_CLIENT_ID` | Optional Google OAuth Client ID | - |
| `GOOGLE_CLIENT_SECRET` | Optional Google OAuth Client Secret | - |
| `NESCO_PORTAL_URL` | Official NESCO customer panel | `https://customer.nesco.gov.bd/pre/panel` |

### 4. Running the Development Server
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Running Tests
```bash
pnpm test
```

### 6. Production Build
```bash
pnpm build
pnpm preview
```

---

## 📱 Mobile-First Design & Strict UI Rules
BillBari was built mobile-first for Bangladeshi smartphone users. All dialogs, sheets, selects, date inputs, alerts, toasts, and dropdowns use accessible shadcn/ui components with zero native browser alerts or confirms.

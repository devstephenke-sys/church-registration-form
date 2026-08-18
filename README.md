<<<<<<< HEAD
# church-registration-form
church registration form
=======
# Pastoral Delegation & Event Registration System with M-PESA Daraja Verification

A production-ready, lightweight Event Registration and M-PESA Payment Verification System tailored for the **Pastoral Delegation for Apostle Johnson Suleman Crusade**.

---

## 🏗 Architecture Overview

- **Frontend:** React 18 + Vite + TypeScript (Hosted on **Vercel**)
- **Backend:** Python FastAPI (Hosted on **Render**)
- **Database:** PostgreSQL (Hosted on **Neon**) / SQLite for zero-config local development
- **Payments:** Safaricom Daraja STK Push (Lipa Na M-PESA Online - Paybill `9410300`, KES 1,000)
- **Emails:** Transactional delivery with inline QR code attachments via **Resend**
- **Verification:** Cryptographically secure QR verification tokens with physical scanner interface

```mermaid
sequenceDiagram
    participant Minister as Pastoral Delegate
    participant FE as React Frontend (Vercel)
    participant BE as FastAPI Backend (Render)
    participant DB as Neon PostgreSQL
    participant Daraja as Safaricom Daraja API
    participant Resend as Resend Email Service

    Minister->>FE: Fill Custom Pastoral Registration Form
    FE->>BE: POST /api/registrations
    BE->>DB: Save Pending Registration
    BE->>FE: Return Registration ID
    FE->>BE: POST /api/payments/stk-push
    BE->>Daraja: Initiate STK Push (Paybill 9410300, KSh 1,000)
    Daraja->>Minister: M-PESA PIN prompt on Phone
    Minister->>Daraja: Enter M-PESA PIN
    Daraja->>BE: POST /api/payments/callback
    Note over BE: Database Row Lock (SELECT FOR UPDATE) — Idempotent
    BE->>DB: Mark Payment & Registration as PAID
    BE->>DB: Generate Sequential REG-2026-XXXXXX & Secure QR Token
    BE->>Resend: Send Receipt with Embedded QR Code
    FE->>BE: Poll /api/registrations/:id/status
    BE->>FE: Return PAID status
    FE->>Minister: Display Success Confirmation + QR Code
```

---

## 🚀 Quick Local Setup

### 1. Backend Setup

```bash
cd backend

# 1. Create and activate virtual environment
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
copy .env.example .env

# 4. Start FastAPI development server
uvicorn backend.app.main:app --reload --port 8000
```

The backend starts at `http://localhost:8000`. API interactive documentation is available at `http://localhost:8000/docs`.

### 2. Frontend Setup

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Start Vite dev server
npm run dev
```

The frontend will run at `http://localhost:5173`.

---

## 🔒 Security & Idempotency Guarantees

1. **No Client Trust:** The registration fee is server-enforced at `KES 1,000`. The frontend cannot modify the amount or mark a registration as paid.
2. **Authoritative Callback:** Payments are only confirmed when Safaricom's webhook hits `/api/payments/callback` with `ResultCode = 0`.
3. **Idempotency with DB Locking:** Double callbacks or retries from Safaricom are locked via `with_for_update()` on the payment record. Duplicate records, multiple emails, and duplicated sequential numbers are strictly prevented.
4. **Secure QR Tokens:** Public QR codes point to `/verify/<cryptographic_random_token>` (32-byte token) instead of predictable IDs.
5. **Double Check-in Guard:** Check-in transitions are atomic; scanning the same QR code a second time displays `ALREADY CHECKED IN` and blocks duplicate entry.

---

## 🧪 Automated Testing

Run the automated test suite covering authentication, phone normalization, payment initiation, callback processing, and double check-in prevention:

```bash
# From workspace root
$env:PYTHONPATH="."; backend\.venv\Scripts\pytest backend\tests -v
```

---

## ⚙️ Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `DATABASE_URL` | Neon PostgreSQL connection string | `postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require` |
| `DARAJA_CONSUMER_KEY` | Safaricom Daraja Consumer Key | `your_consumer_key` |
| `DARAJA_CONSUMER_SECRET` | Safaricom Daraja Consumer Secret | `your_consumer_secret` |
| `MPESA_SHORTCODE` | Daraja Shortcode (Sandbox: 174379 / Prod: 9410300) | `9410300` |
| `MPESA_PASSKEY` | Lipa Na M-PESA Online Passkey | `your_passkey` |
| `MPESA_ENVIRONMENT` | `sandbox` or `production` | `production` |
| `MPESA_CALLBACK_URL` | Public HTTPS Webhook URL | `https://your-api.onrender.com/api/payments/callback` |
| `EMAIL_PROVIDER_API_KEY` | Resend API Key | `re_1234567890` |
| `EMAIL_FROM` | Sender email address | `registrations@yourdomain.com` |
| `EMAIL_FROM_NAME` | Sender display name | `Suleman Crusade Delegation` |
| `FRONTEND_URL` | Hosted frontend origin for CORS | `https://your-app.vercel.app` |
| `QR_BASE_URL` | Base URL for QR scan destination | `https://your-app.vercel.app/verify` |
| `JWT_SECRET` | Secret key for admin authentication | `random_long_secret_key` |

### Frontend (`frontend/.env`)

| Variable | Description | Example |
| :--- | :--- | :--- |
| `VITE_API_URL` | URL of the backend API | `https://your-api.onrender.com` |
| `VITE_EVENT_ID` | UUID of the default event | `d56e090f-e234-4b5c-a5b5-b778789d9703` |

---

## 👥 Default Administrator Credentials

When the database is first initialized, the following default accounts are seeded automatically:

- **Super Admin:** `username: admin` | `password: AdminPassword123`
- **Event Admin:** `username: event_admin` | `password: EventPassword123`
- **Check-in Staff:** `username: staff` | `password: StaffPassword123`

*(Please change these passwords in production via the administrative interface or database).*
>>>>>>> d7f4dde (feat: pastoral delegation event registration and mpesa verification system)

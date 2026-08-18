# Production Deployment Guide

This guide walks you through deploying the Pastoral Delegation & M-PESA Payment Verification System to **Neon (PostgreSQL)**, **Render (FastAPI)**, **Vercel (React)**, and configuring **Safaricom Daraja** in production.

---

## 1. Database Setup (Neon PostgreSQL)

1. Go to [Neon Console](https://console.neon.tech/) and create a new project.
2. Under project settings, copy the **PostgreSQL Connection String**. It looks like:
   ```text
   postgresql://username:password@ep-cool-fog-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
3. Neon handles connection pooling and serverless scaling automatically.

---

## 2. Backend Deployment (Render)

1. Sign in to [Render](https://render.com/).
2. Click **New +** → **Web Service**.
3. Connect your GitHub repository.
4. Set the following build settings:
   - **Root Directory:** `backend` (or leave blank if repository root, with `backend/` in commands)
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
5. Under **Environment Variables**, add:
   ```env
   DATABASE_URL=postgresql://username:password@ep-xyz.neon.tech/neondb?sslmode=require
   DARAJA_CONSUMER_KEY=your_daraja_production_key
   DARAJA_CONSUMER_SECRET=your_daraja_production_secret
   MPESA_SHORTCODE=9410300
   MPESA_PASSKEY=your_daraja_production_passkey
   MPESA_ENVIRONMENT=production
   MPESA_CALLBACK_URL=https://your-service-name.onrender.com/api/payments/callback
   EMAIL_PROVIDER_API_KEY=re_your_resend_api_key
   EMAIL_FROM=registrations@yourdomain.com
   EMAIL_FROM_NAME=Pastoral Delegation Committee
   FRONTEND_URL=https://your-frontend.vercel.app
   QR_BASE_URL=https://your-frontend.vercel.app/verify
   JWT_SECRET=generate_a_random_32_character_hex_string
   ```
6. Click **Create Web Service**.
7. Note down your backend URL (e.g. `https://suleman-crusade-api.onrender.com`).

---

## 3. Frontend Deployment (Vercel)

1. Sign in to [Vercel](https://vercel.com/).
2. Click **Add New...** → **Project**.
3. Import your GitHub repository.
4. Set the **Root Directory** to `frontend`.
5. Under **Environment Variables**, add:
   ```env
   VITE_API_URL=https://suleman-crusade-api.onrender.com
   VITE_EVENT_ID=d56e090f-e234-4b5c-a5b5-b778789d9703
   ```
6. Click **Deploy**.

---

## 4. Safaricom Daraja Production Configuration

1. Log in to the [Safaricom Daraja Portal](https://developer.safaricom.co.ke/).
2. Go to **My Apps** and select your production app.
3. Obtain your:
   - **Consumer Key**
   - **Consumer Secret**
   - **Lipa Na M-PESA Online Passkey** for Paybill `9410300`.
4. Ensure your Render backend environment variable `MPESA_ENVIRONMENT` is set to `production`.
5. Verify that `MPESA_CALLBACK_URL` matches your exact Render public HTTPS URL:
   ```text
   https://suleman-crusade-api.onrender.com/api/payments/callback
   ```

---

## 5. Resend Email Domain Setup

1. Sign in to [Resend](https://resend.com/).
2. Go to **Domains** → **Add Domain** and configure your DNS TXT/MX records for deliverability.
3. Create an API Key in Resend and set it to `EMAIL_PROVIDER_API_KEY` on Render.

---

## 6. Verification & Go-Live Checklist

- [ ] Backend health endpoint (`/`) returns `online`.
- [ ] Database automatically creates tables and seeds default admin users.
- [ ] Test registration flow on mobile / desktop.
- [ ] Confirm STK Push lands on phone with Paybill `9410300` and KSh `1,000`.
- [ ] Verify callback updates registration to `PAID` and issues `REG-2026-XXXXXX`.
- [ ] Confirm email receipt is delivered with inline QR code attachment.
- [ ] Scan QR code using `/admin/verify` and complete participant check-in.

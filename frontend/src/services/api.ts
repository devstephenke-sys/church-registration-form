const RAW_API_URL = import.meta.env.VITE_API_URL || 'https://church-registration-form.onrender.com';
const API_URL = RAW_API_URL.trim().replace(/\/+$/, '');
export const EVENT_ID = (import.meta.env.VITE_EVENT_ID || 'd56e090f-e234-4b5c-a5b5-b778789d9703').trim();

// ─── Auth Token ──────────────────────────────────────────
const TOKEN_KEY = 'admin_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// ─── HTTP helpers ─────────────────────────────────────────
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message = data?.detail
      ? typeof data.detail === 'string'
        ? data.detail
        : JSON.stringify(data.detail)
      : `Request failed (${res.status})`;
    throw new Error(message);
  }

  return data as T;
}

// ─── API Methods ──────────────────────────────────────────

// Registrations
export function createRegistration(payload: {
  event_id: string;
  full_name: string;
  email: string;
  phone: string;
  organization?: string;
  church_ministry?: string;
  ministry_location?: string;
  years_in_ministry?: string;
  sessions_attending?: string[];
  referral_source?: string;
  special_assistance?: string;
  designation?: string;
  county?: string;
}) {
  return request<{ id: string; status: string }>('/api/registrations', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getRegistrationStatus(id: string) {
  return request<{ id: string; status: string; registration_number?: string }>(
    `/api/registrations/${id}/status`
  );
}

export function getRegistrationDetails(id: string) {
  return request<{
    registration: {
      id: string;
      full_name: string;
      email: string;
      phone: string;
      organization?: string;
      church_ministry?: string;
      ministry_location?: string;
      years_in_ministry?: string;
      sessions_attending?: string[];
      referral_source?: string;
      special_assistance?: string;
      status: string;
      registration_number?: string;
    };
    payment?: {
      amount: number;
      mpesa_receipt?: string;
      paid_at?: string;
    };
    qr_code_base64?: string;
    verification_url?: string;
  }>(`/api/registrations/${id}`);
}

// Payments
export function initiateSTKPush(registrationId: string) {
  return request<{
    checkout_request_id: string;
    merchant_request_id: string;
    customer_message: string;
  }>('/api/payments/stk-push', {
    method: 'POST',
    body: JSON.stringify({ registration_id: registrationId }),
  });
}

// QR Verification
export function verifyToken(token: string) {
  return request<{
    status: string;
    message: string;
    registration_number?: string;
    full_name?: string;
    organization?: string;
    checked_in_at?: string;
    mpesa_receipt?: string;
    paid_at?: string;
    amount?: number;
  }>(`/api/verify/${token}`);
}

// Admin Auth
export function adminLogin(username: string, password: string) {
  return request<{ access_token: string; token_type: string; role: string; username: string }>(
    '/api/admin/login',
    { method: 'POST', body: JSON.stringify({ username, password }) }
  );
}

export function getAdminMe() {
  return request<{ id: string; username: string; role: string }>('/api/admin/me');
}

// Admin Dashboard
export function getDashboardStats() {
  return request<{
    total_registrations: number;
    paid_registrations: number;
    pending_payments: number;
    failed_payments: number;
    checked_in_participants: number;
    total_revenue: number;
  }>('/api/admin/dashboard');
}

// Admin Registrations
export function listRegistrations(params?: {
  search?: string;
  status_filter?: string;
  limit?: number;
  offset?: number;
}) {
  const qs = new URLSearchParams();
  if (params?.search) qs.append('search', params.search);
  if (params?.status_filter) qs.append('status_filter', params.status_filter);
  if (params?.limit) qs.append('limit', String(params.limit));
  if (params?.offset) qs.append('offset', String(params.offset));

  return request<{ total: number; registrations: any[] }>(
    `/api/admin/registrations?${qs.toString()}`
  );
}

export function getRegistrationDetail(id: string) {
  return request<{ registration: any; payments: any[]; emails: any[]; qr_token?: string }>(
    `/api/admin/registrations/${id}`
  );
}

export function resendReceipt(id: string) {
  return request<{ status: string; message: string }>(
    `/api/admin/registrations/${id}/resend-receipt`,
    { method: 'POST', body: JSON.stringify({}) }
  );
}

export function manualPayOverride(id: string, reason: string) {
  return request<{ status: string; registration_number: string }>(
    `/api/admin/registrations/${id}/manual-pay`,
    { method: 'POST', body: JSON.stringify({ reason }) }
  );
}

export function checkIn(token: string) {
  return request<{ status: string; message: string; registration_number: string; full_name: string }>(
    '/api/admin/check-in',
    { method: 'POST', body: JSON.stringify({ token }) }
  );
}

export function exportCSV() {
  const token = getToken();
  return fetch(`${API_URL}/api/admin/export`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

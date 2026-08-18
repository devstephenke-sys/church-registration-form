import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createRegistration, EVENT_ID } from '../services/api';

interface FormData {
  full_name: string;
  email: string;
  phone: string;
  church_ministry: string;
  ministry_location: string;
  years_in_ministry: string;
  referral_source: string;
  special_assistance_needed: string;
  special_assistance_details: string;
}

interface FormErrors {
  full_name?: string;
  email?: string;
  phone?: string;
  church_ministry?: string;
  ministry_location?: string;
  years_in_ministry?: string;
  referral_source?: string;
  special_assistance?: string;
}

const YEARS_OPTIONS = [
  'Less than 1 year',
  '1-3 years',
  '4-7 years',
  '8-12 years',
  '13-20 years',
  'More than 20 years',
];

const REFERRAL_OPTIONS = [
  'Social Media',
  'Church Announcement',
  'Word of Mouth',
  'Official Website',
  'Radio or Television',
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormData>({
    full_name: '',
    email: '',
    phone: '',
    church_ministry: '',
    ministry_location: '',
    years_in_ministry: '',
    referral_source: '',
    special_assistance_needed: 'No',
    special_assistance_details: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!form.full_name.trim()) errs.full_name = 'Full name is required';
    if (!form.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Please enter a valid email address';
    }
    if (!form.phone.trim()) {
      errs.phone = 'Phone number is required';
    } else if (!/^(\+254|254|0)(7|1)\d{8}$/.test(form.phone.replace(/\s/g, ''))) {
      errs.phone = 'Enter a valid Kenyan phone number (e.g. 0712345678)';
    }
    if (!form.church_ministry.trim()) {
      errs.church_ministry = 'Name of Church or Ministry is required';
    }
    if (!form.ministry_location.trim()) {
      errs.ministry_location = 'Location of Ministry (City/Region) is required';
    }
    if (!form.years_in_ministry) {
      errs.years_in_ministry = 'Please select your years in ministry';
    }
    if (!form.referral_source) {
      errs.referral_source = 'Please select how you heard about this crusade';
    }
    if (!form.special_assistance_needed) {
      errs.special_assistance = 'Please indicate if special assistance is required';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError('');
    if (!validate()) return;

    setLoading(true);
    try {
      const assistance = form.special_assistance_needed === 'Yes'
        ? `Yes: ${form.special_assistance_details || 'Required'}`
        : 'No';

      const reg = await createRegistration({
        event_id: EVENT_ID,
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        organization: form.church_ministry.trim(),
        church_ministry: form.church_ministry.trim(),
        ministry_location: form.ministry_location.trim(),
        years_in_ministry: form.years_in_ministry,
        referral_source: form.referral_source,
        special_assistance: assistance,
      });

      navigate(`/payment/${reg.id}`);
    } catch (err: any) {
      setApiError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  }

  return (
    <div style={{ minHeight: '100vh', padding: '2.5rem 0' }}>
      <div className="container-narrow">
        {/* Back Link */}
        <Link
          to="/"
          style={{
            color: 'var(--color-text-muted)',
            fontSize: 'var(--font-size-sm)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            marginBottom: '1.5rem',
          }}
        >
          ← Back to Event Overview
        </Link>

        <div className="card">
          {/* Header Banner */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ fontSize: '2.75rem', marginBottom: '0.5rem' }}>🕊️</div>
            <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, lineHeight: 1.25, marginBottom: '0.5rem' }}>
              Registration Form: Pastoral Delegation
            </h1>
            <p style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: 'var(--font-size-base)', marginBottom: '0.5rem' }}>
              Apostle Johnson Suleman Crusade
            </p>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', maxWidth: 540, margin: '0 auto' }}>
              This form is for pastors and ministers wishing to register their attendance and participation for the upcoming crusade event.
            </p>
          </div>

          {apiError && (
            <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
              ⚠️ {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Full Name */}
            <div className="form-group">
              <label className="form-label" htmlFor="full_name">
                Full Name <span className="required">*</span>
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                className={`form-control ${errors.full_name ? 'error' : ''}`}
                placeholder="e.g. Pastor John Mwangi"
                value={form.full_name}
                onChange={handleChange}
                autoComplete="name"
              />
              {errors.full_name && <div className="form-error">⚠ {errors.full_name}</div>}
            </div>

            {/* Email Address */}
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Email Address <span className="required">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className={`form-control ${errors.email ? 'error' : ''}`}
                placeholder="pastor@church.org"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
              />
              {errors.email && <div className="form-error">⚠ {errors.email}</div>}
            </div>

            {/* Phone Number */}
            <div className="form-group">
              <label className="form-label" htmlFor="phone">
                Phone Number (M-PESA) <span className="required">*</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                className={`form-control ${errors.phone ? 'error' : ''}`}
                placeholder="0712 345 678"
                value={form.phone}
                onChange={handleChange}
                autoComplete="tel"
              />
              {errors.phone && <div className="form-error">⚠ {errors.phone}</div>}
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                M-PESA payment prompt (KSh 1,000) will be sent to this number.
              </p>
            </div>

            {/* Name of Church or Ministry */}
            <div className="form-group">
              <label className="form-label" htmlFor="church_ministry">
                Name of Church or Ministry <span className="required">*</span>
              </label>
              <input
                id="church_ministry"
                name="church_ministry"
                type="text"
                className={`form-control ${errors.church_ministry ? 'error' : ''}`}
                placeholder="e.g. Grace International Ministry"
                value={form.church_ministry}
                onChange={handleChange}
              />
              {errors.church_ministry && <div className="form-error">⚠ {errors.church_ministry}</div>}
            </div>

            {/* Location of Ministry */}
            <div className="form-group">
              <label className="form-label" htmlFor="ministry_location">
                Location of Ministry (City/Region) <span className="required">*</span>
              </label>
              <input
                id="ministry_location"
                name="ministry_location"
                type="text"
                className={`form-control ${errors.ministry_location ? 'error' : ''}`}
                placeholder="e.g. Nairobi / Westlands"
                value={form.ministry_location}
                onChange={handleChange}
              />
              {errors.ministry_location && <div className="form-error">⚠ {errors.ministry_location}</div>}
            </div>

            {/* Years in Ministry */}
            <div className="form-group">
              <label className="form-label" htmlFor="years_in_ministry">
                Years in Ministry <span className="required">*</span>
              </label>
              <select
                id="years_in_ministry"
                name="years_in_ministry"
                className={`form-control ${errors.years_in_ministry ? 'error' : ''}`}
                value={form.years_in_ministry}
                onChange={handleChange}
                style={{ cursor: 'pointer' }}
              >
                <option value="">Select your years in ministry</option>
                {YEARS_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              {errors.years_in_ministry && <div className="form-error">⚠ {errors.years_in_ministry}</div>}
            </div>

            {/* Referral Source */}
            <div className="form-group">
              <label className="form-label" htmlFor="referral_source">
                How did you hear about this crusade? <span className="required">*</span>
              </label>
              <select
                id="referral_source"
                name="referral_source"
                className={`form-control ${errors.referral_source ? 'error' : ''}`}
                value={form.referral_source}
                onChange={handleChange}
                style={{ cursor: 'pointer' }}
              >
                <option value="">Select an option</option>
                {REFERRAL_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              {errors.referral_source && <div className="form-error">⚠ {errors.referral_source}</div>}
            </div>

            {/* Special Assistance / Accommodation */}
            <div className="form-group">
              <label className="form-label">
                Do you require special assistance or accommodation? <span className="required">*</span>
              </label>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem', marginBottom: form.special_assistance_needed === 'Yes' ? '0.75rem' : 0 }}>
                {['No', 'Yes'].map(opt => (
                  <label
                    key={opt}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      padding: '0.65rem 1rem',
                      background: form.special_assistance_needed === opt ? 'var(--color-primary-glow)' : 'var(--color-bg-input)',
                      border: `1.5px solid ${form.special_assistance_needed === opt ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="radio"
                      name="special_assistance_needed"
                      value={opt}
                      checked={form.special_assistance_needed === opt}
                      onChange={handleChange}
                      style={{ accentColor: 'var(--color-primary)' }}
                    />
                    <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>{opt}</span>
                  </label>
                ))}
              </div>

              {form.special_assistance_needed === 'Yes' && (
                <textarea
                  name="special_assistance_details"
                  className="form-control"
                  rows={2}
                  placeholder="Please specify your accommodation or accessibility requirements..."
                  value={form.special_assistance_details}
                  onChange={handleChange}
                  style={{ marginTop: '0.5rem' }}
                />
              )}
            </div>

            {/* Payment Summary */}
            <div className="card card-sm" style={{ background: 'var(--color-bg-primary)', margin: '1.75rem 0 1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Delegation Registration Fee</span>
                <span style={{ fontWeight: 800, color: 'var(--color-primary)', fontSize: '1.1rem' }}>KSh 1,000</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Payment Channel</span>
                <span style={{ fontWeight: 600 }}>M-PESA Paybill 9410300</span>
              </div>
            </div>

            {/* Submit */}
            <button
              id="submit-register"
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading}
            >
              {loading ? (
                <><span className="spinner" style={{ width: 18, height: 18 }} /> Submitting Registration...</>
              ) : (
                '🕊️ Complete & Pay KSh 1,000 via M-PESA'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

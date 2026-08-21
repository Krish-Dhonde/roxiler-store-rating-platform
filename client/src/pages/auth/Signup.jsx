import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { 
  validateEmail, 
  validateName, 
  validateAddress, 
  validatePassword,
  checkPasswordRequirements,
  NAME_MIN,
  NAME_MAX,
  ADDRESS_MAX
} from '../../utils/validation';
import FormInput from '../../components/common/FormInput';
import Button from '../../components/common/Button';
import AlertMessage from '../../components/common/AlertMessage';
import { User, Mail, MapPin, Lock, UserPlus, Check, X, Shield, Store, CheckCircle2 } from 'lucide-react';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [apiValidationErrors, setApiValidationErrors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pwdRequirements = checkPasswordRequirements(formData.password);
  const passwordsMatch = Boolean(
    formData.password && formData.confirmPassword && formData.password === formData.confirmPassword
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (apiError) {
      setApiError(null);
      setApiValidationErrors([]);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    const nameErr = validateName(formData.name);
    if (nameErr) newErrors.name = nameErr;

    const emailErr = validateEmail(formData.email);
    if (emailErr) newErrors.email = emailErr;

    const addressErr = validateAddress(formData.address);
    if (addressErr) newErrors.address = addressErr;

    const pwdErr = validatePassword(formData.password);
    if (pwdErr) newErrors.password = pwdErr;

    if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    } else if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirm password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setApiError(null);
    setApiValidationErrors([]);

    try {
      await signup({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        address: formData.address.trim(),
        password: formData.password
      });

      // Normal signup defaults to 'user' role -> redirect to stores explorer
      navigate('/stores', { replace: true });
    } catch (err) {
      setApiError(err.message || 'Failed to create account. Please check your information.');
      if (err.errors && Array.isArray(err.errors)) {
        setApiValidationErrors(err.errors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-card auth-card-wide" style={{ maxWidth: '64rem' }}>
      {/* Prominent Onboarding Mode Switcher (Customer vs Store Owner) */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          border: '1px solid var(--border-medium)', 
          background: '#f1f5f9', 
          marginBottom: '2rem' 
        }}
      >
        <Link 
          to="/signup"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '0.85rem 1rem',
            textDecoration: 'none',
            fontSize: '0.9rem',
            fontWeight: 700,
            background: '#ffffff',
            color: 'var(--primary)',
            borderRight: '1px solid var(--border-medium)',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <User size={18} />
          <span>Customer Account</span>
        </Link>

        <Link 
          to="/register-store"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '0.85rem 1rem',
            textDecoration: 'none',
            fontSize: '0.9rem',
            fontWeight: 600,
            background: 'transparent',
            color: 'var(--text-secondary)',
            transition: 'background var(--transition-fast)'
          }}
        >
          <Store size={18} />
          <span>Register as Store Owner</span>
        </Link>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {/* Notebook-style Two-Column Layout */}
        <div className="notebook-grid">
          
          {/* Left Portion: Profile & Personal Contact Information (Page 1) */}
          <div className="notebook-left-page">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <Link to="/" className="brand-icon-box" style={{ textDecoration: 'none' }}>
                <Store size={22} />
              </Link>
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                  Roxiler
                </h2>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Customer Registration
                </span>
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', margin: 0 }}>
                1. Personal & Contact Details
              </h3>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Enter your identity and address information
              </p>
            </div>

            <FormInput
              label="Full Name"
              id="name"
              name="name"
              type="text"
              placeholder="e.g. Eleanor Vance Customer"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              icon={User}
              maxLength={NAME_MAX}
              showCharCount
              hint={`Must be between ${NAME_MIN} and ${NAME_MAX} characters`}
              autoFocus
              required
            />

            <FormInput
              label="Email Address"
              id="email"
              name="email"
              type="email"
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              icon={Mail}
              autoComplete="email"
              required
            />

            <FormInput
              label="Residential Address"
              id="address"
              name="address"
              type="text"
              placeholder="Street address, Apartment, City, State"
              value={formData.address}
              onChange={handleChange}
              error={errors.address}
              icon={MapPin}
              maxLength={ADDRESS_MAX}
              showCharCount
              hint={`Up to ${ADDRESS_MAX} characters`}
              required
            />
          </div>

          {/* Central Spine Line */}
          <div className="notebook-spine" />

          {/* Right Portion: Credentials & Security Checklist (Page 2) */}
          <div className="notebook-right-page">
            <div style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', margin: 0 }}>
                2. Account Security & Credentials
              </h3>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Set a strong cryptographic password
              </p>
            </div>

            {apiError && (
              <AlertMessage
                type="danger"
                message={apiError}
                errors={apiValidationErrors}
              />
            )}

            <FormInput
              label="Create Password"
              id="password"
              name="password"
              type="password"
              placeholder="Choose a strong password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              icon={Lock}
              autoComplete="new-password"
              required
            />

            {/* Live Functional Color-Changing Checklist (Red -> Green) */}
            <div className="password-requirements">
              <div className="password-requirements-title">
                <Shield size={14} style={{ color: 'var(--primary)' }} />
                <span>Password Requirements:</span>
              </div>
              <div className={`req-item ${pwdRequirements.length ? 'met' : ''}`}>
                {pwdRequirements.length ? (
                  <Check size={14} style={{ color: '#16a34a' }} />
                ) : (
                  <X size={14} style={{ color: '#dc2626' }} />
                )}
                <span>8 to 16 characters long</span>
              </div>
              <div className={`req-item ${pwdRequirements.uppercase ? 'met' : ''}`}>
                {pwdRequirements.uppercase ? (
                  <Check size={14} style={{ color: '#16a34a' }} />
                ) : (
                  <X size={14} style={{ color: '#dc2626' }} />
                )}
                <span>At least one uppercase letter (A-Z)</span>
              </div>
              <div className={`req-item ${pwdRequirements.specialChar ? 'met' : ''}`}>
                {pwdRequirements.specialChar ? (
                  <Check size={14} style={{ color: '#16a34a' }} />
                ) : (
                  <X size={14} style={{ color: '#dc2626' }} />
                )}
                <span>At least one special character (!@#$%^&*...)</span>
              </div>
            </div>

            <FormInput
              label="Confirm Password"
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Re-enter your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              icon={Lock}
              autoComplete="new-password"
              required
            />

            {passwordsMatch && (
              <p style={{ fontSize: '0.8rem', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '-0.5rem', marginBottom: '0.75rem', fontWeight: 600 }}>
                <CheckCircle2 size={14} />
                Passwords match
              </p>
            )}

            <Button
              type="submit"
              variant="primary"
              block
              size="lg"
              loading={isSubmitting}
              icon={UserPlus}
              style={{ marginTop: '0.5rem' }}
            >
              Create Customer Account
            </Button>

            <div className="auth-footer" style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div>
                Want to register your business store?{' '}
                <Link to="/register-store" style={{ fontWeight: 700, color: 'var(--primary)' }}>
                  Register as Store Owner
                </Link>
              </div>
              <div style={{ color: 'var(--text-muted)' }}>
                Already have an account?{' '}
                <Link to="/login" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

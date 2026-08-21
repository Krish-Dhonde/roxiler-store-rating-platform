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
import { 
  Store, 
  User, 
  Mail, 
  MapPin, 
  Lock, 
  PlusCircle, 
  Check, 
  X, 
  Shield, 
  CheckCircle2, 
  Building2 
} from 'lucide-react';

export default function RegisterStore() {
  const { registerStore } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    storeName: '',
    storeEmail: '',
    storeAddress: '',
    ownerName: '',
    ownerEmail: '',
    ownerAddress: '',
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

    // Store validations
    const storeNameErr = validateName(formData.storeName, 'Store Name');
    if (storeNameErr) newErrors.storeName = storeNameErr;

    const storeEmailErr = validateEmail(formData.storeEmail, 'Store Email');
    if (storeEmailErr) newErrors.storeEmail = storeEmailErr;

    const storeAddressErr = validateAddress(formData.storeAddress, 'Store Address');
    if (storeAddressErr) newErrors.storeAddress = storeAddressErr;

    // Owner validations
    const ownerNameErr = validateName(formData.ownerName, 'Owner Name');
    if (ownerNameErr) newErrors.ownerName = ownerNameErr;

    const ownerEmailErr = validateEmail(formData.ownerEmail, 'Owner Email');
    if (ownerEmailErr) newErrors.ownerEmail = ownerEmailErr;

    const ownerAddressErr = validateAddress(formData.ownerAddress, 'Owner Address');
    if (ownerAddressErr) newErrors.ownerAddress = ownerAddressErr;

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
      await registerStore({
        storeName: formData.storeName.trim(),
        storeEmail: formData.storeEmail.trim().toLowerCase(),
        storeAddress: formData.storeAddress.trim(),
        ownerName: formData.ownerName.trim(),
        ownerEmail: formData.ownerEmail.trim().toLowerCase(),
        ownerAddress: formData.ownerAddress.trim(),
        password: formData.password
      });

      // Automatically redirect to Store Owner Dashboard
      navigate('/owner/dashboard', { replace: true });
    } catch (err) {
      setApiError(err.message || 'Failed to register store. Please verify your details.');
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
            fontWeight: 600,
            background: 'transparent',
            color: 'var(--text-secondary)',
            borderRight: '1px solid var(--border-medium)',
            transition: 'background var(--transition-fast)'
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
            fontWeight: 700,
            background: '#ffffff',
            color: 'var(--primary)',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <Store size={18} />
          <span>Register as Store Owner</span>
        </Link>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {/* Notebook-Style Two Column Merchant Registration */}
        <div className="notebook-grid">

          {/* Left Column: Store Profile & Details (Page 1) */}
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
                  Merchant & Store Onboarding
                </span>
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Building2 size={18} style={{ color: 'var(--primary)' }} />
                1. Store Business Information
              </h3>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Provide details about your store or commercial establishment
              </p>
            </div>

            <FormInput
              label="Store Business Name"
              id="storeName"
              name="storeName"
              type="text"
              placeholder="e.g. Organic Greens Supermarket"
              value={formData.storeName}
              onChange={handleChange}
              error={errors.storeName}
              icon={Store}
              maxLength={NAME_MAX}
              showCharCount
              hint={`Between ${NAME_MIN} and ${NAME_MAX} characters`}
              autoFocus
              required
            />

            <FormInput
              label="Store Contact Email"
              id="storeEmail"
              name="storeEmail"
              type="email"
              placeholder="contact@storename.com"
              value={formData.storeEmail}
              onChange={handleChange}
              error={errors.storeEmail}
              icon={Mail}
              autoComplete="email"
              required
            />

            <FormInput
              label="Store Physical Address"
              id="storeAddress"
              name="storeAddress"
              type="text"
              placeholder="Street address, Suite/Unit, City, State"
              value={formData.storeAddress}
              onChange={handleChange}
              error={errors.storeAddress}
              icon={MapPin}
              maxLength={ADDRESS_MAX}
              showCharCount
              hint={`Up to ${ADDRESS_MAX} characters`}
              required
            />
          </div>

          {/* Center Spine Divider */}
          <div className="notebook-spine" />

          {/* Right Column: Store Owner Profile & Credentials (Page 2) */}
          <div className="notebook-right-page">
            <div style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <User size={18} style={{ color: 'var(--accent-purple)' }} />
                2. Store Owner Profile & Credentials
              </h3>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Set up your Store Owner administrative account
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
              label="Owner Full Name"
              id="ownerName"
              name="ownerName"
              type="text"
              placeholder="e.g. John Doe Store Owner"
              value={formData.ownerName}
              onChange={handleChange}
              error={errors.ownerName}
              icon={User}
              maxLength={NAME_MAX}
              showCharCount
              hint={`Between ${NAME_MIN} and ${NAME_MAX} characters`}
              required
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
              <FormInput
                label="Owner Login Email"
                id="ownerEmail"
                name="ownerEmail"
                type="email"
                placeholder="owner@personal.com"
                value={formData.ownerEmail}
                onChange={handleChange}
                error={errors.ownerEmail}
                icon={Mail}
                autoComplete="email"
                required
              />

              <FormInput
                label="Owner Address"
                id="ownerAddress"
                name="ownerAddress"
                type="text"
                placeholder="Residential address"
                value={formData.ownerAddress}
                onChange={handleChange}
                error={errors.ownerAddress}
                icon={MapPin}
                maxLength={ADDRESS_MAX}
                required
              />
            </div>

            <FormInput
              label="Account Password"
              id="password"
              name="password"
              type="password"
              placeholder="Create strong password"
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
              placeholder="Re-enter password"
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
              icon={PlusCircle}
              style={{ marginTop: '0.5rem' }}
            >
              Register Store & Create Account
            </Button>

            <div className="auth-footer" style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div>
                Looking to browse and rate stores?{' '}
                <Link to="/signup" style={{ fontWeight: 700, color: 'var(--primary)' }}>
                  Register as Customer
                </Link>
              </div>
              <div style={{ color: 'var(--text-muted)' }}>
                Already registered?{' '}
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

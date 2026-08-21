import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { validateEmail } from '../../utils/validation';
import FormInput from '../../components/common/FormInput';
import Button from '../../components/common/Button';
import AlertMessage from '../../components/common/AlertMessage';
import { Mail, Lock, LogIn, Store } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field-level error on change
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (apiError) setApiError(null);
  };

  const validateForm = () => {
    const newErrors = {};
    const emailErr = validateEmail(formData.email);
    if (emailErr) newErrors.email = emailErr;
    if (!formData.password) newErrors.password = 'Password is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setApiError(null);

    try {
      const loggedInUser = await login(formData.email.trim(), formData.password);

      // If user was redirected from a protected route, navigate there
      const intendedDestination = location.state?.from?.pathname;

      if (intendedDestination && intendedDestination !== '/login' && intendedDestination !== '/signup') {
        navigate(intendedDestination, { replace: true });
        return;
      }

      // Default role-based redirection
      switch (loggedInUser.role) {
        case 'admin':
          navigate('/admin/dashboard', { replace: true });
          break;
        case 'owner':
          navigate('/owner/dashboard', { replace: true });
          break;
        case 'user':
        default:
          navigate('/stores', { replace: true });
          break;
      }
    } catch (err) {
      setApiError(err.message || 'Invalid email or password. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-card auth-card">
      <div className="auth-header">
        <Link to="/" className="brand-icon-box" style={{ textDecoration: 'none', marginBottom: '1rem' }}>
          <Store size={22} />
        </Link>
        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-subtitle">Sign in to your Roxiler platform account</p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {apiError && <AlertMessage type="danger" message={apiError} />}

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
          autoFocus
          required
        />

        <FormInput
          label="Password"
          id="password"
          name="password"
          type="password"
          placeholder="Enter your password"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          icon={Lock}
          autoComplete="current-password"
          required
        />

        <Button
          type="submit"
          variant="primary"
          block
          size="lg"
          loading={isSubmitting}
          icon={LogIn}
          style={{ marginTop: '1rem' }}
        >
          Sign In
        </Button>

        <div className="auth-footer" style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Don't have an account yet?</span>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link to="/signup" style={{ fontWeight: 600, color: 'var(--primary)' }}>
              Register as Customer
            </Link>
            <span style={{ color: 'var(--border-strong)' }}>•</span>
            <Link to="/register-store" style={{ fontWeight: 600, color: 'var(--accent-purple)' }}>
              Register as Store Owner
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}

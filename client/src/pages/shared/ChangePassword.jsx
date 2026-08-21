import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { validatePassword, checkPasswordRequirements } from '../../utils/validation';
import PageContainer from '../../components/layout/PageContainer';
import FormInput from '../../components/common/FormInput';
import Button from '../../components/common/Button';
import AlertMessage from '../../components/common/AlertMessage';
import { Key, Lock, Check, X } from 'lucide-react';

export default function ChangePassword() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pwdRequirements = checkPasswordRequirements(formData.newPassword);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (apiError) setApiError(null);
    if (successMessage) setSuccessMessage(null);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    const pwdErr = validatePassword(formData.newPassword);
    if (pwdErr) {
      newErrors.newPassword = pwdErr;
    }

    if (formData.currentPassword && formData.newPassword && formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }

    if (formData.newPassword && formData.confirmNewPassword && formData.newPassword !== formData.confirmNewPassword) {
      newErrors.confirmNewPassword = 'New passwords do not match';
    } else if (!formData.confirmNewPassword) {
      newErrors.confirmNewPassword = 'Confirm new password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setApiError(null);
    setSuccessMessage(null);

    try {
      const res = await authService.changePassword(
        formData.currentPassword,
        formData.newPassword
      );

      setSuccessMessage(res.message || 'Password updated successfully!');
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
      });
    } catch (err) {
      setApiError(err.message || 'Failed to update password. Please check your current password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer
      title="Change Password"
      subtitle="Update your security credentials"
    >
      <div style={{ maxWidth: '32rem' }}>
        <div className="glass-card">
          <form onSubmit={handleSubmit} noValidate>
            {successMessage && <AlertMessage type="success" message={successMessage} />}
            {apiError && <AlertMessage type="danger" message={apiError} />}

            <FormInput
              label="Current Password"
              id="currentPassword"
              name="currentPassword"
              type="password"
              placeholder="Enter current password"
              value={formData.currentPassword}
              onChange={handleChange}
              error={errors.currentPassword}
              icon={Lock}
              autoComplete="current-password"
              required
            />

            <FormInput
              label="New Password"
              id="newPassword"
              name="newPassword"
              type="password"
              placeholder="Enter new password"
              value={formData.newPassword}
              onChange={handleChange}
              error={errors.newPassword}
              icon={Key}
              autoComplete="new-password"
              required
            />

            {/* Live Checklist for New Password */}
            <div className="password-requirements">
              <p style={{ fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                New Password Requirements:
              </p>
              <div className={`req-item ${pwdRequirements.length ? 'met' : ''}`}>
                {pwdRequirements.length ? <Check size={14} /> : <X size={14} />}
                <span>8 to 16 characters long</span>
              </div>
              <div className={`req-item ${pwdRequirements.uppercase ? 'met' : ''}`}>
                {pwdRequirements.uppercase ? <Check size={14} /> : <X size={14} />}
                <span>At least one uppercase letter (A-Z)</span>
              </div>
              <div className={`req-item ${pwdRequirements.specialChar ? 'met' : ''}`}>
                {pwdRequirements.specialChar ? <Check size={14} /> : <X size={14} />}
                <span>At least one special character (!@#$%^&*...)</span>
              </div>
            </div>

            <FormInput
              label="Confirm New Password"
              id="confirmNewPassword"
              name="confirmNewPassword"
              type="password"
              placeholder="Re-enter new password"
              value={formData.confirmNewPassword}
              onChange={handleChange}
              error={errors.confirmNewPassword}
              icon={Key}
              autoComplete="new-password"
              style={{ marginTop: '1rem' }}
              required
            />

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <Button
                type="submit"
                variant="primary"
                loading={isSubmitting}
                icon={Key}
              >
                Update Password
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(-1)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </PageContainer>
  );
}

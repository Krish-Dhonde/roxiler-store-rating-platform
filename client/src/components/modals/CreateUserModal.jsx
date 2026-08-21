import React, { useState } from 'react';
import { adminService } from '../../services/adminService';
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
import Modal from '../common/Modal';
import FormInput from '../common/FormInput';
import Button from '../common/Button';
import AlertMessage from '../common/AlertMessage';
import { User, Mail, MapPin, Lock, Shield, UserPlus, Check, X } from 'lucide-react';

export default function CreateUserModal({
  isOpen,
  onClose,
  onUserCreated
}) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    address: '',
    role: 'user'
  });

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [apiValidationErrors, setApiValidationErrors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pwdRequirements = checkPasswordRequirements(formData.password);

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

    const nameErr = validateName(formData.name, 'Full Name');
    if (nameErr) newErrors.name = nameErr;

    const emailErr = validateEmail(formData.email);
    if (emailErr) newErrors.email = emailErr;

    const addressErr = validateAddress(formData.address);
    if (addressErr) newErrors.address = addressErr;

    const pwdErr = validatePassword(formData.password);
    if (pwdErr) newErrors.password = pwdErr;

    if (!['user', 'owner', 'admin'].includes(formData.role)) {
      newErrors.role = 'Invalid role selected';
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
      const createdUser = await adminService.createUser({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        address: formData.address.trim(),
        role: formData.role
      });

      if (onUserCreated) {
        onUserCreated(createdUser);
      }

      // Reset state and close
      setFormData({
        name: '',
        email: '',
        password: '',
        address: '',
        role: 'user'
      });
      onClose();
    } catch (err) {
      setApiError(err.message || 'Failed to create user.');
      if (err.errors && Array.isArray(err.errors)) {
        setApiValidationErrors(err.errors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New User Account"
    >
      <form onSubmit={handleSubmit} noValidate>
        {apiError && (
          <AlertMessage
            type="danger"
            message={apiError}
            errors={apiValidationErrors}
          />
        )}

        <FormInput
          label="Full Name"
          id="admin_user_name"
          name="name"
          type="text"
          placeholder="e.g. Alexander Wright Owner"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
          icon={User}
          maxLength={NAME_MAX}
          showCharCount
          hint={`Must be ${NAME_MIN}–${NAME_MAX} characters`}
          required
        />

        <FormInput
          label="Email Address"
          id="admin_user_email"
          name="email"
          type="email"
          placeholder="user@example.com"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          icon={Mail}
          required
        />

        <div className="form-group">
          <label htmlFor="admin_user_role" className="form-label">
            Account Role
          </label>
          <div className="input-wrapper">
            <select
              id="admin_user_role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="form-select"
            >
              <option value="user">Customer (Normal User)</option>
              <option value="owner">Store Owner</option>
              <option value="admin">System Administrator</option>
            </select>
          </div>
        </div>

        <FormInput
          label="Address"
          id="admin_user_address"
          name="address"
          type="text"
          placeholder="Street address, City, State"
          value={formData.address}
          onChange={handleChange}
          error={errors.address}
          icon={MapPin}
          maxLength={ADDRESS_MAX}
          showCharCount
          required
        />

        <FormInput
          label="Initial Password"
          id="admin_user_password"
          name="password"
          type="password"
          placeholder="Choose initial password"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          icon={Lock}
          required
        />

        {/* Live Password Complexity Checklist */}
        <div className="password-requirements">
          <p style={{ fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
            Password Requirements:
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

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            icon={UserPlus}
          >
            Create User
          </Button>
        </div>
      </form>
    </Modal>
  );
}

import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { 
  validateEmail, 
  validateName, 
  validateAddress,
  NAME_MIN,
  NAME_MAX,
  ADDRESS_MAX
} from '../../utils/validation';
import Modal from '../common/Modal';
import FormInput from '../common/FormInput';
import Button from '../common/Button';
import AlertMessage from '../common/AlertMessage';
import { Store, Mail, MapPin, User, PlusCircle } from 'lucide-react';

export default function CreateStoreModal({
  isOpen,
  onClose,
  onStoreCreated
}) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    ownerId: ''
  });

  const [owners, setOwners] = useState([]);
  const [loadingOwners, setLoadingOwners] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [apiValidationErrors, setApiValidationErrors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load available store owners when modal opens
  useEffect(() => {
    async function loadOwners() {
      if (!isOpen) return;
      try {
        setLoadingOwners(true);
        const res = await adminService.getUsers({ role: 'owner', limit: 100 });
        setOwners(res.users || []);
      } catch (err) {
        console.error('Failed to load store owners list:', err);
      } finally {
        setLoadingOwners(false);
      }
    }
    loadOwners();
  }, [isOpen]);

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

    const nameErr = validateName(formData.name, 'Store Name');
    if (nameErr) newErrors.name = nameErr;

    const emailErr = validateEmail(formData.email, 'Store Email');
    if (emailErr) newErrors.email = emailErr;

    const addressErr = validateAddress(formData.address, 'Store Address');
    if (addressErr) newErrors.address = addressErr;

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
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        address: formData.address.trim(),
        ownerId: formData.ownerId ? Number(formData.ownerId) : null
      };

      const createdStore = await adminService.createStore(payload);

      if (onStoreCreated) {
        onStoreCreated(createdStore);
      }

      setFormData({
        name: '',
        email: '',
        address: '',
        ownerId: ''
      });
      onClose();
    } catch (err) {
      setApiError(err.message || 'Failed to create store.');
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
      title="Register New Store"
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
          label="Store Name"
          id="admin_store_name"
          name="name"
          type="text"
          placeholder="e.g. Apex Electronics & Gadgets"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
          icon={Store}
          maxLength={NAME_MAX}
          showCharCount
          hint={`Must be ${NAME_MIN}–${NAME_MAX} characters`}
          required
        />

        <FormInput
          label="Store Contact Email"
          id="admin_store_email"
          name="email"
          type="email"
          placeholder="contact@store.com"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          icon={Mail}
          required
        />

        <FormInput
          label="Physical Address"
          id="admin_store_address"
          name="address"
          type="text"
          placeholder="Building, Street, Quarter, City"
          value={formData.address}
          onChange={handleChange}
          error={errors.address}
          icon={MapPin}
          maxLength={ADDRESS_MAX}
          showCharCount
          required
        />

        {/* Owner Assignment Dropdown */}
        <div className="form-group">
          <label htmlFor="admin_store_owner" className="form-label">
            <span>Assign Store Owner</span>
            <span className="form-label-optional">Optional</span>
          </label>
          <div className="input-wrapper">
            <select
              id="admin_store_owner"
              name="ownerId"
              value={formData.ownerId}
              onChange={handleChange}
              className="form-select"
              disabled={loadingOwners}
            >
              <option value="">-- No Owner Assigned (Unassigned) --</option>
              {owners.map((owner) => (
                <option key={owner.id} value={owner.id}>
                  {owner.name} ({owner.email})
                </option>
              ))}
            </select>
          </div>
          {loadingOwners && <p className="form-hint">Loading registered owners...</p>}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            icon={PlusCircle}
          >
            Create Store
          </Button>
        </div>
      </form>
    </Modal>
  );
}

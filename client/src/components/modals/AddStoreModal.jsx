import React, { useState } from 'react';
import { ownerService } from '../../services/ownerService';
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
import { Store, Mail, MapPin, PlusCircle } from 'lucide-react';

export default function AddStoreModal({
  isOpen,
  onClose,
  onStoreCreated
}) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: ''
  });

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [apiValidationErrors, setApiValidationErrors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        address: formData.address.trim()
      };

      const createdStore = await ownerService.createStore(payload);

      if (onStoreCreated) {
        onStoreCreated(createdStore);
      }

      // Reset form
      setFormData({
        name: '',
        email: '',
        address: ''
      });
      setErrors({});
      onClose();
    } catch (err) {
      setApiError(err.message || 'Failed to create store. Please check the provided information.');
      if (err.errors && Array.isArray(err.errors)) {
        setApiValidationErrors(err.errors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      email: '',
      address: ''
    });
    setErrors({});
    setApiError(null);
    setApiValidationErrors([]);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Register New Store Location"
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
          id="owner_store_name"
          name="name"
          type="text"
          placeholder="e.g. Organic Greens Supermarket - Downtown"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
          icon={Store}
          maxLength={NAME_MAX}
          showCharCount
          hint={`Must be between ${NAME_MIN} and ${NAME_MAX} characters`}
          autoFocus
          required
        />

        <FormInput
          label="Store Email"
          id="owner_store_email"
          name="email"
          type="email"
          placeholder="contact@organicgreens.com"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          icon={Mail}
          hint="Official contact or customer service email for this location"
          autoComplete="email"
          required
        />

        <FormInput
          label="Store Physical Address"
          id="owner_store_address"
          name="address"
          type="text"
          placeholder="Street address, Suite/Unit, City, State"
          value={formData.address}
          onChange={handleChange}
          error={errors.address}
          icon={MapPin}
          maxLength={ADDRESS_MAX}
          showCharCount
          hint={`Up to ${ADDRESS_MAX} characters`}
          required
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.75rem' }}>
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            icon={PlusCircle}
          >
            Register Store
          </Button>
        </div>
      </form>
    </Modal>
  );
}

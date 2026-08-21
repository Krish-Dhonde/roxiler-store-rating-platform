import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function FormInput({
  label,
  id,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  hint,
  optional = false,
  icon: Icon,
  disabled = false,
  maxLength,
  showCharCount = false,
  className = '',
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label htmlFor={id || name} className="form-label">
          <span>{label}</span>
          {showCharCount && maxLength && (
            <span className="form-label-optional">
              {String(value || '').length}/{maxLength}
            </span>
          )}
          {optional && !showCharCount && <span className="form-label-optional">Optional</span>}
        </label>
      )}

      <div className="input-wrapper">
        {Icon && (
          <span className="input-icon-left">
            <Icon size={18} />
          </span>
        )}

        <input
          id={id || name}
          name={name}
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          className={`form-input ${Icon ? 'has-icon' : ''} ${error ? 'input-error' : ''}`}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            className="input-icon-right"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>

      {error && (
        <p className="form-error" role="alert">
          <AlertCircle size={14} />
          <span>{error}</span>
        </p>
      )}

      {!error && hint && <p className="form-hint">{hint}</p>}
    </div>
  );
}

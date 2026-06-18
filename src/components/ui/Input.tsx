import React from 'react';

interface InputProps {
  id?: string;
  type?: string;
  name: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  inputMode?: 'text' | 'tel' | 'email' | 'numeric' | 'decimal' | 'search' | 'url' | 'none';
  autoComplete?: string;
  maxLength?: number;
  required?: boolean;
  invalid?: boolean;
  className?: string;
}

export default function Input({
  id,
  type = 'text',
  name,
  placeholder,
  value,
  onChange,
  onBlur,
  onFocus,
  inputMode,
  autoComplete,
  maxLength,
  required = false,
  invalid = false,
  className = '',
}: InputProps) {
  return (
    <input
      id={id}
      type={type}
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      onFocus={onFocus}
      inputMode={inputMode}
      autoComplete={autoComplete}
      maxLength={maxLength}
      required={required}
      aria-invalid={invalid || undefined}
      className={`input-field ${invalid ? 'border-red-400 focus:ring-red-500' : ''} ${className}`}
    />
  );
}

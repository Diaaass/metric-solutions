import React from 'react';

interface InputProps {
  id?: string;
  type?: string;
  name: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  className?: string;
}

export default function Input({
  id,
  type = 'text',
  name,
  placeholder,
  value,
  onChange,
  required = false,
  className = ''
}: InputProps) {
  return (
    <input
      id={id}
      type={type}
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      className={`input-field ${className}`}
    />
  );
}

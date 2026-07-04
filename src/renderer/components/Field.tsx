import type { FieldError, UseFormRegisterReturn } from 'react-hook-form';

interface FieldProps {
  label: string;
  registration: UseFormRegisterReturn;
  error?: FieldError;
  type?: 'text' | 'number';
  min?: number;
  max?: number;
}

export function Field({ label, registration, error, type = 'text', min, max }: FieldProps) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type={type} min={min} max={max} {...registration} />
      {error ? <small>{error.message}</small> : null}
    </label>
  );
}

interface TextAreaProps {
  label: string;
  registration: UseFormRegisterReturn;
  error?: FieldError;
}

export function TextArea({ label, registration, error }: TextAreaProps) {
  return (
    <label className="field field-wide">
      <span>{label}</span>
      <textarea rows={4} {...registration} />
      {error ? <small>{error.message}</small> : null}
    </label>
  );
}

/**
 * Form-related TypeScript interfaces
 */

export interface SelectChangeEvent {
  target: {
    value: string;
    name?: string;
  };
}

export interface FormFieldProps {
  label?: string;
  required?: boolean;
  disabled?: boolean;
  loading?: boolean;
  error?: boolean;
  helperText?: string;
}

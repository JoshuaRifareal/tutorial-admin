import { useState } from 'react';

const NumberInput = ({ 
  value, 
  onChange, 
  label, 
  placeholder = '',
  required = false, 
  min, 
  max, 
  className = '',
  disabled = false,
}) => {
  const [error, setError] = useState('');
  const [isTouched, setIsTouched] = useState(false);

  const validate = (val) => {
    if (val === '' || val === null || val === undefined) {
      if (required) {
        return 'This field is required';
      }
      return '';
    }
    
    const num = Number(val);
    if (isNaN(num)) {
      return 'Must be a valid number';
    }
    
    if (!Number.isInteger(num)) {
      return 'Must be a whole number';
    }
    
    if (min !== undefined && num < min) {
      return `Minimum value is ${min}`;
    }
    
    if (max !== undefined && num > max) {
      return `Maximum value is ${max}`;
    }
    
    return '';
  };

  const handleChange = (e) => {
    const val = e.target.value;
    onChange(val);
    if (isTouched) {
      setError(validate(val));
    }
  };

  const handleBlur = () => {
    setIsTouched(true);
    setError(validate(value));
  };

  const isValid = !error || value === '' || value === null || value === undefined;

  return (
    <div className={`inline-flex flex-col w-full ${className}`}>
      <div className="flex items-center gap-2 w-full">
        {label && <span className="text-sm text-white/40 whitespace-nowrap">{label}</span>}
        <input
          type="text"
          inputMode="numeric"
          value={value || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={`input-dark w-full ${
            isTouched && !isValid 
              ? 'border-red-500 text-red-400' 
              : ''
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          style={{
            width: '100%',
            minWidth: '0',
          }}
        />
      </div>
      {isTouched && error && (
        <span className="text-xs text-red-400 mt-0.5">{error}</span>
      )}
    </div>
  );
};

export default NumberInput;
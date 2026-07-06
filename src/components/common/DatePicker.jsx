import { forwardRef } from 'react';
import ReactDatePicker from 'react-datepicker';
import { Calendar } from 'lucide-react';
import 'react-datepicker/dist/react-datepicker.css';

const DatePicker = ({ 
  value, 
  onChange, 
  placeholder = 'Select date',
  className = '',
  disabled = false,
}) => {
  // Custom input component
  const CustomInput = forwardRef(({ value: displayValue, onClick, placeholder: placeholderText }, ref) => (
    <button
      ref={ref}
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors focus:outline-none focus:border-purple-500 ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10'
      } ${className}`}
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        color: displayValue ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.4)',
      }}
    >
      <Calendar className="w-4 h-4 text-white/40" />
      <span>{displayValue || placeholderText}</span>
    </button>
  ));

  CustomInput.displayName = 'CustomInput';

  // Parse date for DatePicker
  const selectedDate = value ? new Date(value) : null;

  const handleChange = (date) => {
    if (date) {
      const formatted = date.toISOString().split('T')[0];
      onChange(formatted);
    } else {
      onChange('');
    }
  };

  return (
    <ReactDatePicker
      selected={selectedDate}
      onChange={handleChange}
      customInput={<CustomInput value={value ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''} placeholder={placeholder} />}
      dateFormat="yyyy-MM-dd"
      placeholderText={placeholder}
      popperClassName="datepicker-popper"
      calendarClassName="datepicker-calendar"
      disabled={disabled}
    />
  );
};

export default DatePicker;
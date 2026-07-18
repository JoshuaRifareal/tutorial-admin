import { forwardRef, useState, useRef, useLayoutEffect, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [isPositioned, setIsPositioned] = useState(false);
  const buttonRef = useRef(null);
  const containerRef = useRef(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        const portal = document.getElementById('datepicker-portal-container');
        if (portal && portal.contains(event.target)) {
          return;
        }
        setIsOpen(false);
        setIsPositioned(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useLayoutEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const calendarHeight = 300;
      const calendarWidth = 260;
      
      let top = rect.bottom + 8;
      let left = rect.left;
      
      if (top + calendarHeight > window.innerHeight) {
        top = rect.top - calendarHeight - 8;
      }
      
      if (left + calendarWidth > window.innerWidth) {
        left = window.innerWidth - calendarWidth - 16;
      }
      
      if (left < 16) {
        left = 16;
      }
      
      if (top < 16) {
        top = 16;
      }
      
      setDropdownPosition({
        top: top,
        left: left,
      });
      setIsPositioned(true);
    } else {
      setIsPositioned(false);
    }
  }, [isOpen]);

  const handleDateChange = (date) => {
    if (date) {
      const formatted = date.toISOString().split('T')[0];
      onChange(formatted);
    } else {
      onChange('');
    }
    setIsOpen(false);
    setIsPositioned(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsPositioned(false);
  };

  const handleInputClick = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const renderCalendar = () => {
    if (!isOpen || !isPositioned) return null;

    return createPortal(
      <div 
        id="datepicker-portal-container"
        className="fixed rounded-xl p-0 shadow-2xl"
        style={{
          top: dropdownPosition.top,
          left: dropdownPosition.left,
          backgroundColor: '#1a1a1a',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          zIndex: 9999,
        }}
      >
        <ReactDatePicker
          selected={value ? new Date(value) : null}
          onChange={handleDateChange}
          dateFormat="yyyy-MM-dd"
          inline
          calendarClassName="datepicker-calendar-inner"
        />
      </div>,
      document.body
    );
  };

  const displayValue = value ? new Date(value).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  }) : '';

  return (
    <div className={`w-full ${className}`} ref={containerRef}>
      <button
        ref={buttonRef}
        onClick={handleInputClick}
        disabled={disabled}
        className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors focus:outline-none focus:border-purple-500 w-full ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10'
        } ${className}`}
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: displayValue ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.4)',
        }}
      >
        <Calendar className="w-4 h-4 text-white/40 flex-shrink-0" />
        <span className="flex-1 text-left truncate">{displayValue || placeholder}</span>
      </button>
      {renderCalendar()}
    </div>
  );
};

export default DatePicker;
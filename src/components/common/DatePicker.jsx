import { useState, useRef, useEffect, useLayoutEffect } from 'react';
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
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const [isPositioned, setIsPositioned] = useState(false);
  const buttonRef = useRef(null);
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    if (value) {
      setSelectedDate(new Date(value));
    } else {
      setSelectedDate(null);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target)) {
        const dropdown = document.getElementById('datepicker-dropdown');
        if (dropdown && dropdown.contains(event.target)) {
          return;
        }
        setIsOpen(false);
        setIsPositioned(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useLayoutEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownHeight = 380;
      
      let top = rect.bottom + 8;
      let left = rect.left;
      const width = Math.max(rect.width, 280);
      
      if (top + dropdownHeight > window.innerHeight) {
        top = rect.top - dropdownHeight - 8;
      }
      
      if (left + width > window.innerWidth) {
        left = window.innerWidth - width - 16;
      }
      
      if (left < 16) {
        left = 16;
      }
      
      setDropdownPosition({
        top: Math.max(16, top),
        left: Math.max(16, left),
        width: width,
      });
      setIsPositioned(true);
    } else {
      setIsPositioned(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleReposition = () => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const dropdownHeight = 380;
        
        let top = rect.bottom + 8;
        let left = rect.left;
        const width = Math.max(rect.width, 280);
        
        if (top + dropdownHeight > window.innerHeight) {
          top = rect.top - dropdownHeight - 8;
        }
        
        if (left + width > window.innerWidth) {
          left = window.innerWidth - width - 16;
        }
        
        if (left < 16) {
          left = 16;
        }
        
        setDropdownPosition({
          top: Math.max(16, top),
          left: Math.max(16, left),
          width: width,
        });
      }
    };

    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);
    return () => {
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [isOpen]);

  const handleDateChange = (date) => {
    if (date) {
      const formatted = date.toISOString().split('T')[0];
      onChange(formatted);
      setSelectedDate(date);
    } else {
      onChange('');
      setSelectedDate(null);
    }
    setIsOpen(false);
    setIsPositioned(false);
  };

  const renderDropdown = () => {
    if (!isOpen || !isPositioned) return null;

    return createPortal(
      <div 
        id="datepicker-dropdown"
        className="fixed z-[9999] rounded-xl p-1 shadow-2xl"
        style={{
          top: dropdownPosition.top,
          left: dropdownPosition.left,
          minWidth: dropdownPosition.width,
          maxWidth: 300,
          background: 'rgba(26, 26, 26, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        }}
      >
        <div className="datepicker-calendar">
          <ReactDatePicker
            selected={selectedDate}
            onChange={handleDateChange}
            dateFormat="yyyy-MM-dd"
            inline
            calendarClassName="datepicker-calendar-inner"
          />
        </div>
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
    <div className={`relative inline-block ${className}`}>
      <button
        ref={buttonRef}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors focus:outline-none focus:border-purple-500 ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10'
        }`}
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: displayValue ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.4)',
        }}
      >
        <Calendar className="w-4 h-4 text-white/40" />
        <span>{displayValue || placeholder}</span>
      </button>
      {renderDropdown()}
    </div>
  );
};

export default DatePicker;
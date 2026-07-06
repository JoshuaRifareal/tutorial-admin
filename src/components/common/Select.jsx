import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

const Select = ({ 
  value, 
  onChange, 
  options, 
  placeholder = 'Select...',
  className = '',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const [isPositioned, setIsPositioned] = useState(false);
  const buttonRef = useRef(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target)) {
        const dropdown = document.getElementById('select-dropdown');
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
      const dropdownHeight = Math.min(options.length * 36 + 16, 200);
      
      let top = rect.bottom + 8;
      let left = rect.left;
      const width = Math.max(rect.width, 120);
      
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
  }, [isOpen, options]);

  useEffect(() => {
    if (!isOpen) return;

    const handleReposition = () => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const dropdownHeight = Math.min(options.length * 36 + 16, 200);
        
        let top = rect.bottom + 8;
        let left = rect.left;
        const width = Math.max(rect.width, 120);
        
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
  }, [isOpen, options]);

  const renderDropdown = () => {
    if (!isOpen || !isPositioned) return null;

    return createPortal(
      <div 
        id="select-dropdown"
        className="fixed z-[9999] rounded-xl p-1 shadow-2xl"
        style={{
          top: dropdownPosition.top,
          left: dropdownPosition.left,
          minWidth: dropdownPosition.width,
          maxWidth: 200,
          maxHeight: 200,
          overflowY: 'auto',
          background: 'rgba(26, 26, 26, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        }}
      >
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => {
              onChange(option.value);
              setIsOpen(false);
              setIsPositioned(false);
            }}
            className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors ${
              value === option.value
                ? 'bg-purple-500/20 text-purple-400'
                : 'text-white/60 hover:bg-white/5 hover:text-white'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>,
      document.body
    );
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        ref={buttonRef}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10'
        }`}
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: value ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.4)',
        }}
      >
        <span>{selectedOption?.label || placeholder}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {renderDropdown()}
    </div>
  );
};

export default Select;
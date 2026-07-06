import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

const PeriodDropdown = ({ options = ['7 days', '30 days', '90 days', 'All'], value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const [isPositioned, setIsPositioned] = useState(false);
  const buttonRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target)) {
        const dropdown = document.getElementById('period-dropdown');
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
      const dropdownHeight = 200; // Approximate height
      const dropdownWidth = Math.max(rect.width, 120);
      
      // Calculate position
      let top = rect.bottom + 8;
      let left = rect.left;
      
      // Check if dropdown would go off the bottom of the screen
      if (top + dropdownHeight > window.innerHeight) {
        // Position above the button instead
        top = rect.top - dropdownHeight - 8;
      }
      
      // Check if dropdown would go off the right of the screen
      if (left + dropdownWidth > window.innerWidth) {
        left = window.innerWidth - dropdownWidth - 16;
      }
      
      // Check if dropdown would go off the left of the screen
      if (left < 16) {
        left = 16;
      }
      
      setDropdownPosition({
        top: Math.max(16, top),
        left: Math.max(16, left),
        width: dropdownWidth,
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
        const dropdownHeight = 200;
        const dropdownWidth = Math.max(rect.width, 120);
        
        let top = rect.bottom + 8;
        let left = rect.left;
        
        if (top + dropdownHeight > window.innerHeight) {
          top = rect.top - dropdownHeight - 8;
        }
        
        if (left + dropdownWidth > window.innerWidth) {
          left = window.innerWidth - dropdownWidth - 16;
        }
        
        if (left < 16) {
          left = 16;
        }
        
        setDropdownPosition({
          top: Math.max(16, top),
          left: Math.max(16, left),
          width: dropdownWidth,
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

  const renderDropdown = () => {
    if (!isOpen || !isPositioned) return null;

    return createPortal(
      <div 
        id="period-dropdown"
        className="fixed z-[9999] rounded-xl p-1 shadow-2xl"
        style={{
          top: dropdownPosition.top,
          left: dropdownPosition.left,
          minWidth: dropdownPosition.width,
          maxWidth: 180,
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
            key={option}
            onClick={() => {
              onChange(option);
              setIsOpen(false);
              setIsPositioned(false);
            }}
            className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors ${
              value === option
                ? 'bg-purple-500/20 text-purple-400'
                : 'text-white/60 hover:bg-white/5 hover:text-white'
            }`}
          >
            {option}
          </button>
        ))}
      </div>,
      document.body
    );
  };

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-2 py-1 hover:bg-white/5 rounded-lg transition-colors"
        style={{
          color: 'rgba(255, 255, 255, 0.5)',
        }}
      >
        <span className="text-xs font-medium">{value}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {renderDropdown()}
    </div>
  );
};

export default PeriodDropdown;
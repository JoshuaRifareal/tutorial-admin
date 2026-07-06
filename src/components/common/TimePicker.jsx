import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

const TimePicker = ({ 
  value, 
  onChange, 
  placeholder = 'TBA',
  className = '',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const [isPositioned, setIsPositioned] = useState(false);
  const [selectedHour, setSelectedHour] = useState('');
  const [selectedMinute, setSelectedMinute] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('AM');
  const buttonRef = useRef(null);

  // Parse value if exists
  useEffect(() => {
    if (value && value !== 'TBA') {
      const match = value.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (match) {
        setSelectedHour(match[1]);
        setSelectedMinute(match[2]);
        setSelectedPeriod(match[3].toUpperCase());
      }
    } else {
      setSelectedHour('');
      setSelectedMinute('');
      setSelectedPeriod('AM');
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target)) {
        const dropdown = document.getElementById('timepicker-dropdown');
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
      const dropdownHeight = 210;
      
      let top = rect.bottom + 8;
      let left = rect.left;
      const width = Math.max(rect.width, 200);
      
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
        const dropdownHeight = 210;
        
        let top = rect.bottom + 8;
        let left = rect.left;
        const width = Math.max(rect.width, 200);
        
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

  const handleTimeSelect = () => {
    if (selectedHour && selectedMinute) {
      const time = `${selectedHour}:${selectedMinute} ${selectedPeriod}`;
      onChange(time);
      setIsOpen(false);
      setIsPositioned(false);
    }
  };

  const handleClear = () => {
    onChange('TBA');
    setIsOpen(false);
    setIsPositioned(false);
  };

  const renderDropdown = () => {
    if (!isOpen || !isPositioned) return null;

    const hours = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
    const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

    // Custom select styles
    const selectStyle = {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '6px',
      padding: '4px 6px',
      color: 'white',
      fontSize: '12px',
      outline: 'none',
      width: '100%',
      cursor: 'pointer',
    };

    const optionStyle = {
      backgroundColor: '#1a1a1a',
      color: 'white',
    };

    return createPortal(
      <div 
        id="timepicker-dropdown"
        className="fixed z-[9999] rounded-xl p-3 shadow-2xl"
        style={{
          top: dropdownPosition.top,
          left: dropdownPosition.left,
          minWidth: dropdownPosition.width,
          maxWidth: 220,
          background: 'rgba(26, 26, 26, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        }}
      >
        <div className="flex gap-1.5 mb-2">
          <div className="flex-1">
            <label className="text-[10px] text-white/40 block mb-0.5">Hour</label>
            <select
              value={selectedHour}
              onChange={(e) => setSelectedHour(e.target.value)}
              style={selectStyle}
            >
              <option value="" style={optionStyle}>-</option>
              {hours.map(h => (
                <option key={h} value={h} style={optionStyle}>{h}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1">
            <label className="text-[10px] text-white/40 block mb-0.5">Min</label>
            <select
              value={selectedMinute}
              onChange={(e) => setSelectedMinute(e.target.value)}
              style={selectStyle}
            >
              <option value="" style={optionStyle}>-</option>
              {minutes.map(m => (
                <option key={m} value={m} style={optionStyle}>{m}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1">
            <label className="text-[10px] text-white/40 block mb-0.5">AM/PM</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              style={selectStyle}
            >
              <option value="AM" style={optionStyle}>AM</option>
              <option value="PM" style={optionStyle}>PM</option>
            </select>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleTimeSelect}
            disabled={!selectedHour || !selectedMinute}
            className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Apply
          </button>
          <button
            onClick={handleClear}
            className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
          >
            TBA
          </button>
        </div>
      </div>,
      document.body
    );
  };

  const displayValue = value && value !== 'TBA' ? value : 'TBA';
  const isTBA = displayValue === 'TBA';

  return (
    <div className={`inline-block ${className}`}>
      <button
        ref={buttonRef}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex items-center justify-center gap-1 transition-colors focus:outline-none w-full ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        style={{
          fontSize: '12px',
          fontWeight: isTBA ? '400' : '500',
          color: isTBA ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.7)',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '4px',
          padding: '2px 8px',
          minHeight: '24px',
        }}
      >
        <span>{displayValue}</span>
        <ChevronDown 
          className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          style={{ color: isTBA ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.4)' }}
        />
      </button>
      {renderDropdown()}
    </div>
  );
};

export default TimePicker;
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
  const buttonRef = useRef(null);

  // Parse value - support both string and object format
  const parseValue = (val) => {
    if (!val || val === 'TBA') {
      return { start: '', end: '' };
    }
    if (typeof val === 'string') {
      return { start: val, end: '' };
    }
    if (typeof val === 'object') {
      return { start: val.start || '', end: val.end || '' };
    }
    return { start: '', end: '' };
  };

  const [selectedStartHour, setSelectedStartHour] = useState('');
  const [selectedStartMinute, setSelectedStartMinute] = useState('');
  const [selectedStartPeriod, setSelectedStartPeriod] = useState('AM');
  const [selectedEndHour, setSelectedEndHour] = useState('');
  const [selectedEndMinute, setSelectedEndMinute] = useState('');
  const [selectedEndPeriod, setSelectedEndPeriod] = useState('AM');

  // Parse value on mount and when value changes
  useEffect(() => {
    const parsed = parseValue(value);
    if (parsed.start) {
      const startMatch = parsed.start.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (startMatch) {
        setSelectedStartHour(startMatch[1]);
        setSelectedStartMinute(startMatch[2]);
        setSelectedStartPeriod(startMatch[3].toUpperCase());
      }
    } else {
      setSelectedStartHour('');
      setSelectedStartMinute('');
      setSelectedStartPeriod('AM');
    }

    if (parsed.end) {
      const endMatch = parsed.end.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (endMatch) {
        setSelectedEndHour(endMatch[1]);
        setSelectedEndMinute(endMatch[2]);
        setSelectedEndPeriod(endMatch[3].toUpperCase());
      }
    } else {
      setSelectedEndHour('');
      setSelectedEndMinute('');
      setSelectedEndPeriod('AM');
    }
  }, [value]);

  // Click outside handler - ignores clicks inside CustomSelect
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is inside any custom select dropdown
      const customSelectDropdown = document.getElementById('custom-select-dropdown');
      if (customSelectDropdown && customSelectDropdown.contains(event.target)) {
        return;
      }
      
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

  // Position the dropdown
  useLayoutEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownHeight = 280;
      const dropdownWidth = 220;
      
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
      
      if (top < 16) {
        top = 16;
      }
      
      setDropdownPosition({
        top: top,
        left: left,
        width: dropdownWidth,
      });
      setIsPositioned(true);
    } else {
      setIsPositioned(false);
    }
  }, [isOpen]);

  const handleTimeSelect = () => {
    if (selectedStartHour && selectedStartMinute) {
      const startTime = `${selectedStartHour}:${selectedStartMinute} ${selectedStartPeriod}`;
      let endTime = '';
      if (selectedEndHour && selectedEndMinute) {
        endTime = `${selectedEndHour}:${selectedEndMinute} ${selectedEndPeriod}`;
      }
      onChange({ start: startTime, end: endTime });
      setIsOpen(false);
      setIsPositioned(false);
    }
  };

  const handleClear = () => {
    onChange('TBA');
    setIsOpen(false);
    setIsPositioned(false);
  };

  // Custom Select component inside TimePicker
  const CustomSelect = ({ options, value, onChange: onSelectChange, placeholder: selectPlaceholder }) => {
    const [selectOpen, setSelectOpen] = useState(false);
    const [selectPosition, setSelectPosition] = useState({ top: 0, left: 0, width: 0 });
    const [selectPositioned, setSelectPositioned] = useState(false);
    const selectButtonRef = useRef(null);
    const selectContainerRef = useRef(null);

    useLayoutEffect(() => {
      if (selectOpen && selectButtonRef.current) {
        const rect = selectButtonRef.current.getBoundingClientRect();
        const dropdownHeight = Math.min(options.length * 32 + 8, 200);
        
        let top = rect.bottom + 4;
        let left = rect.left;
        const width = rect.width;
        
        if (top + dropdownHeight > window.innerHeight) {
          top = rect.top - dropdownHeight - 4;
        }
        
        if (left + width > window.innerWidth) {
          left = window.innerWidth - width - 16;
        }
        
        if (left < 16) {
          left = 16;
        }
        
        if (top < 16) {
          top = 16;
        }
        
        setSelectPosition({
          top: top,
          left: left,
          width: width,
        });
        setSelectPositioned(true);
      } else {
        setSelectPositioned(false);
      }
    }, [selectOpen, options]);

    // Click outside for custom select only - stops propagation to TimePicker
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (selectContainerRef.current && !selectContainerRef.current.contains(event.target)) {
          const dropdown = document.getElementById('custom-select-dropdown');
          if (dropdown && dropdown.contains(event.target)) {
            return;
          }
          setSelectOpen(false);
          setSelectPositioned(false);
          // Stop propagation to prevent TimePicker from closing
          event.stopPropagation();
        }
      };
      if (selectOpen) {
        document.addEventListener('mousedown', handleClickOutside);
      }
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [selectOpen]);

    // Disable body scroll when TimePicker or options are open
    useEffect(() => {
      if (isOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
      return () => {
        document.body.style.overflow = '';
      };
    }, [isOpen]);

    const selectedLabel = options.find(opt => opt.value === value)?.label || selectPlaceholder;

    const renderSelectDropdown = () => {
      if (!selectOpen || !selectPositioned) return null;

      return createPortal(
        <div 
          id="custom-select-dropdown"
          className="fixed z-[9999] rounded-lg p-1 shadow-2xl"
          style={{
            top: selectPosition.top,
            left: selectPosition.left,
            width: '60px', 
            maxWidth: '70px',
            maxHeight: 200,
            overflowY: 'auto',
            backgroundColor: '#1a1a1a',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '8px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onSelectChange(option.value);
                setSelectOpen(false);
                setSelectPositioned(false);
              }}
              className="w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors"
              style={{
                color: value === option.value ? '#a78bfa' : 'rgba(255, 255, 255, 0.7)',
                backgroundColor: value === option.value ? 'rgba(124, 58, 237, 0.15)' : 'transparent',
              }}
              onMouseEnter={(e) => {
                if (value !== option.value) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (value !== option.value) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              {option.label}
            </button>
          ))}
        </div>,
        document.body
      );
    };

    return (
      <div className="relative w-full" ref={selectContainerRef}>
        <button
          ref={selectButtonRef}
          onClick={(e) => {
            e.stopPropagation();
            if (!disabled) setSelectOpen(!selectOpen);
          }}
          disabled={disabled}
          className="flex items-center justify-between w-full px-2 py-1.5 rounded-lg text-xs transition-colors"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: value ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.4)',
            minHeight: '28px',
          }}
        >
          <span className="truncate">{selectedLabel}</span>
          <ChevronDown className={`w-3 h-3 flex-shrink-0 transition-transform ${selectOpen ? 'rotate-180' : ''}`} style={{ color: 'rgba(255,255,255,0.4)' }} />
        </button>
        {renderSelectDropdown()}
      </div>
    );
  };

  const renderDropdown = () => {
    if (!isOpen || !isPositioned) return null;

    const hours = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
    const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

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
        {/* Start Time */}
        <div className="text-[10px] text-white/40 mb-1">Start</div>
        <div className="flex gap-1.5 mb-3">
          <div className="flex-1">
            <CustomSelect
              value={selectedStartHour}
              onChange={setSelectedStartHour}
              options={hours.map(h => ({ value: h, label: h }))}
              placeholder="-"
            />
          </div>
          <div className="flex-1">
            <CustomSelect
              value={selectedStartMinute}
              onChange={setSelectedStartMinute}
              options={minutes.map(m => ({ value: m, label: m }))}
              placeholder="-"
            />
          </div>
          <div className="flex-1">
            <CustomSelect
              value={selectedStartPeriod}
              onChange={setSelectedStartPeriod}
              options={[
                { value: 'AM', label: 'AM' },
                { value: 'PM', label: 'PM' },
              ]}
              placeholder="AM/PM"
            />
          </div>
        </div>

        {/* End Time */}
        <div className="text-[10px] text-white/40 mb-1">End</div>
        <div className="flex gap-1.5 mb-3">
          <div className="flex-1">
            <CustomSelect
              value={selectedEndHour}
              onChange={setSelectedEndHour}
              options={hours.map(h => ({ value: h, label: h }))}
              placeholder="-"
            />
          </div>
          <div className="flex-1">
            <CustomSelect
              value={selectedEndMinute}
              onChange={setSelectedEndMinute}
              options={minutes.map(m => ({ value: m, label: m }))}
              placeholder="-"
            />
          </div>
          <div className="flex-1">
            <CustomSelect
              value={selectedEndPeriod}
              onChange={setSelectedEndPeriod}
              options={[
                { value: 'AM', label: 'AM' },
                { value: 'PM', label: 'PM' },
              ]}
              placeholder="AM/PM"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleTimeSelect}
            disabled={!selectedStartHour || !selectedStartMinute}
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

  // Format display value
  const getDisplayValue = () => {
    if (!value || value === 'TBA') return 'TBA';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
      if (value.start && value.end) {
        return `${value.start} → ${value.end}`;
      }
      return value.start || 'TBA';
    }
    return 'TBA';
  };

  const displayValue = getDisplayValue();
  const isTBA = displayValue === 'TBA';

  return (
    <div className={`inline-block w-full ${className}`}>
      <button
        ref={buttonRef}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex flex-col items-center justify-center gap-0 transition-colors focus:outline-none w-full ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        style={{
          fontSize: '10px',
          fontWeight: isTBA ? '400' : '500',
          color: isTBA ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.7)',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '4px',
          padding: '2px 6px',
          minHeight: '24px',
          minWidth: '60px',
        }}
      >
        <span style={{ fontSize: '10px', lineHeight: '1.2' }}>
          {isTBA ? 'TBA' : (typeof value === 'object' ? value.start : value)}
        </span>
        {!isTBA && typeof value === 'object' && value.end && (
          <>
            <span style={{ fontSize: '8px', lineHeight: '1', color: 'rgba(255,255,255,0.3)' }}>→</span>
            <span style={{ fontSize: '10px', lineHeight: '1.2' }}>{value.end}</span>
          </>
        )}
        <ChevronDown 
          className={`w-3 h-3 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          style={{ color: isTBA ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.4)', marginTop: '1px' }}
        />
      </button>
      {renderDropdown()}
    </div>
  );
};

export default TimePicker;
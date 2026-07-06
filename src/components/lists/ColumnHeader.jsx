import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronUp, ArrowUpDown } from 'lucide-react';

const ColumnHeader = ({ 
  label, 
  type = 'filter',
  options = [], 
  value, 
  onChange,
  sortDirection,
  onSortToggle,
  showCounts = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const [isPositioned, setIsPositioned] = useState(false);
  const buttonRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target)) {
        const dropdown = document.getElementById('column-dropdown');
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

  // Use useLayoutEffect for synchronous positioning before paint
  useLayoutEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width: Math.max(rect.width, 150),
      });
      // Mark as positioned after setting position
      setIsPositioned(true);
    } else {
      setIsPositioned(false);
    }
  }, [isOpen]);

  // Handle window resize and scroll to reposition
  useEffect(() => {
    if (!isOpen) return;

    const handleReposition = () => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + 8,
          left: rect.left,
          width: Math.max(rect.width, 150),
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
        id="column-dropdown"
        className="fixed z-[9999] bg-[#1a1a1a] border border-white/10 rounded-xl p-1 shadow-2xl"
        style={{
          top: dropdownPosition.top,
          left: dropdownPosition.left,
          minWidth: dropdownPosition.width,
          maxWidth: 280,
          maxHeight: 300,
          overflowY: 'auto',
        }}
      >
        {type === 'sort' ? (
          <>
            <button
              onClick={() => {
                onSortToggle('asc');
                setIsOpen(false);
                setIsPositioned(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center gap-2 ${
                sortDirection === 'asc'
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <ChevronUp className="w-3 h-3" />
              A → Z
            </button>
            <button
              onClick={() => {
                onSortToggle('desc');
                setIsOpen(false);
                setIsPositioned(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center gap-2 ${
                sortDirection === 'desc'
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <ChevronDown className="w-3 h-3" />
              Z → A
            </button>
            {sortDirection && (
              <>
                <div className="border-t border-white/10 my-1" />
                <button
                  onClick={() => {
                    onSortToggle(null);
                    setIsOpen(false);
                    setIsPositioned(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs text-white/40 hover:bg-white/5 hover:text-white/60 transition-colors"
                >
                  Clear Sort
                </button>
              </>
            )}
          </>
        ) : (
          <>
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                  setIsPositioned(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center justify-between ${
                  value === option.value
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span>{option.label}</span>
                {showCounts && option.count !== undefined && (
                  <span className="text-[10px] text-white/30">({option.count})</span>
                )}
              </button>
            ))}
            {value !== 'all' && (
              <>
                <div className="border-t border-white/10 my-1" />
                <button
                  onClick={() => {
                    onChange('all');
                    setIsOpen(false);
                    setIsPositioned(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs text-white/40 hover:bg-white/5 hover:text-white/60 transition-colors"
                >
                  Clear Filter
                </button>
              </>
            )}
          </>
        )}
      </div>,
      document.body
    );
  };

  // For sort type button
  if (type === 'sort') {
    return (
      <div className="relative inline-block">
        <button
          ref={buttonRef}
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 text-xs font-medium text-white/60 hover:text-white/90 transition-colors whitespace-nowrap"
        >
          <span>{label}</span>
          {sortDirection === 'asc' && <ChevronUp className="w-3 h-3" />}
          {sortDirection === 'desc' && <ChevronDown className="w-3 h-3" />}
          {!sortDirection && <ArrowUpDown className="w-3 h-3" />}
        </button>
        {renderDropdown()}
      </div>
    );
  }

  // For filter type button
  const activeFilter = value !== 'all';

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1 text-xs font-medium transition-colors whitespace-nowrap ${
          activeFilter ? 'text-purple-400' : 'text-white/60 hover:text-white/90'
        }`}
      >
        <span>{label}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {renderDropdown()}
    </div>
  );
};

export default ColumnHeader;
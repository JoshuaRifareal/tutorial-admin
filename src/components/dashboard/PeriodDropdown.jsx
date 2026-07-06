import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const PeriodDropdown = ({ options = ['7d', '30d', '90d', 'All'], value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLabel = value;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-2.5 py-1 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-xs text-white/60"
      >
        <span>{selectedLabel}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-20 bg-[#1a1a1a] border border-white/10 rounded-lg p-1 z-50 shadow-xl">
          {options.map((option) => (
            <button
              key={option}
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
              className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                value === option
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PeriodDropdown;
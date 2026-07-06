import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Calendar } from 'lucide-react';
import { DATE_FILTERS } from '../../utils/constants';

const DateFilter = ({ value, onChange, label }) => {
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

  const selectedLabel = DATE_FILTERS.find(f => f.value === value)?.label || 'Select';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="glass-card px-4 py-2 flex items-center gap-2 text-sm hover:bg-white/10 transition-colors"
      >
        <Calendar className="w-4 h-4 text-white/40" />
        <span className="text-white/80">{label}: {selectedLabel}</span>
        <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 left-0 right-0 glass-card p-2 z-10 min-w-[180px]">
          {DATE_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => {
                onChange(filter.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                value === filter.value
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default DateFilter;
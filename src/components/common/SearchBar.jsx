import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useUIStore from '../../stores/uiStore';

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const { setSearchQuery } = useUIStore();

  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  // Handle click outside - clear and close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        if (isExpanded) {
          // Clear query and close
          setQuery('');
          setSearchQuery('');
          setIsExpanded(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded, setSearchQuery]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchQuery(query);
      navigate('/tutees');
      setIsExpanded(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setSearchQuery('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleClose = () => {
    setQuery('');
    setSearchQuery('');
    setIsExpanded(false);
  };

  return (
    <div className="w-full" ref={containerRef}>
      <form 
        onSubmit={handleSearch}
        className={`glass-card p-3 flex items-center gap-3 transition-colors cursor-text ${
          isExpanded ? 'bg-white/10' : 'bg-white/5'
        }`}
        onClick={() => {
          if (!isExpanded) {
            setIsExpanded(true);
            setTimeout(() => inputRef.current?.focus(), 50);
          }
        }}
      >
        <Search className="w-5 h-5 text-white/40 flex-shrink-0" />
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsExpanded(true)}
          placeholder="Search tutees, tutors..."
          className="flex-1 bg-transparent text-white placeholder-white/40 outline-none text-sm min-w-0"
        />
        
        {/* Always show X button when expanded */}
        {isExpanded && (
          <button
            type="button"
            onClick={handleClose}
            className="p-1 hover:bg-white/10 rounded-full transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4 text-white/40" />
          </button>
        )}
      </form>
    </div>
  );
};

export default SearchBar;
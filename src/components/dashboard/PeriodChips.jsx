const PeriodChips = ({ options = ['7d', '30d', '90d', 'All'], value, onChange }) => {
    return (
      <div className="flex gap-1">
        {options.map((period) => (
          <button
            key={period}
            onClick={() => onChange(period)}
            className={`px-2.5 py-1 text-xs rounded-full transition-all ${
              value === period
                ? 'bg-purple-500/20 text-purple-400'
                : 'text-white/40 hover:text-white/70 hover:bg-white/5'
            }`}
          >
            {period}
          </button>
        ))}
      </div>
    );
  };
  
  export default PeriodChips;
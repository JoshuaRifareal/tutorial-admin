import { ArrowUp, ArrowDown } from 'lucide-react';

const StatsCard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendValue,
  onClick,
  color = 'purple'
}) => {
  const colorClasses = {
    purple: 'from-purple-500 to-indigo-400',
    green: 'from-green-500 to-emerald-400',
    blue: 'from-blue-500 to-cyan-400',
    orange: 'from-rose-500 to-pink-400',
    emerald: 'from-emerald-500 to-teal-400',
    amber: 'from-amber-500 to-orange-400',
  };

  return (
    <div 
      onClick={onClick}
      className="glass-card p-4 cursor-pointer hover:scale-[1.02] transition-all duration-200"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-white/60 text-xs font-medium truncate">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {trend && (
            <div className="flex items-center gap-1 mt-1">
              {trend === 'up' ? (
                <ArrowUp className="w-3 h-3 text-green-400" />
              ) : (
                <ArrowDown className="w-3 h-3 text-red-400" />
              )}
              <span className={`text-xs ${trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                {trendValue}
              </span>
            </div>
          )}
        </div>
        <div className={`p-2 rounded-xl bg-gradient-to-r ${colorClasses[color]} bg-opacity-20 flex-shrink-0 ml-2`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
const StatusChip = ({ status }) => {
    const statusConfig = {
      active: {
        color: 'bg-green-500/20 text-green-400 border-green-500/30',
        dot: 'bg-green-400',
      },
      pending: {
        color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        dot: 'bg-yellow-400',
      },
      inactive: {
        color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
        dot: 'bg-gray-400',
      },
    };
  
    const config = statusConfig[status?.toLowerCase()] || statusConfig.inactive;
  
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
        {status || 'Unknown'}
      </span>
    );
  };
  
  export default StatusChip;
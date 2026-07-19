const ModalityPill = ({ modality }) => {
    const modalityConfig = {
      'F2F': {
        color: 'bg-green-500/20 text-green-400 border-green-500/30',
        dot: 'bg-green-400',
        label: 'F2F',
      },
      'ON': {
        color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        dot: 'bg-blue-400',
        label: 'ON',
      },
      'HB': {
        color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
        dot: 'bg-purple-400',
        label: 'HB',
      },
      // Fallback for full names (for existing data)
      'Face-to-face': {
        color: 'bg-green-500/20 text-green-400 border-green-500/30',
        dot: 'bg-green-400',
        label: 'F2F',
      },
      'Online': {
        color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        dot: 'bg-blue-400',
        label: 'ON',
      },
      'Home-based': {
        color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
        dot: 'bg-purple-400',
        label: 'HB',
      },
    };
  
    const config = modalityConfig[modality] || {
      color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      dot: 'bg-gray-400',
      label: modality || '-',
    };
  
    if (!modality) return null;
  
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
        {config.label}
      </span>
    );
  };
  
  export default ModalityPill;
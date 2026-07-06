import { Bell, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Reminders = ({ reminders }) => {
  const navigate = useNavigate();

  if (!reminders || reminders.length === 0) {
    return (
      <div className="glass-card p-4 flex items-center gap-3">
        <Bell className="w-5 h-5 text-white/40" />
        <span className="text-white/40 text-sm">No upcoming reminders</span>
      </div>
    );
  }

  return (
    <div className="glass-card p-4 space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <Bell className="w-5 h-5 text-yellow-400" />
        <span className="text-sm font-medium text-white/80">Reminders</span>
      </div>
      {reminders.map((reminder, index) => (
        <button
          key={index}
          onClick={() => navigate(`/tutee/${reminder.id}`)}
          className="w-full text-left flex items-start gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors"
        >
          <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-white/80">{reminder.message}</p>
            <p className="text-xs text-white/40">{reminder.days} days remaining</p>
          </div>
        </button>
      ))}
    </div>
  );
};

export default Reminders;
import { useState, useRef, useEffect } from 'react';
import { Bell, Zap, Settings, CheckCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import logo from '../../assets/logo.png';

const Header = ({ reminders = [], lastSync = new Date() }) => {
  const navigate = useNavigate();
  const [showReminders, setShowReminders] = useState(false);
  const [showConnection, setShowConnection] = useState(false);
  const reminderRef = useRef(null);
  const connectionRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (reminderRef.current && !reminderRef.current.contains(event.target)) {
        setShowReminders(false);
      }
      if (connectionRef.current && !connectionRef.current.contains(event.target)) {
        setShowConnection(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const reminderCount = reminders.length;

  return (
    <header className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/10">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left: Logo with circle */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full overflow-hidden bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center">
            <img 
              src={logo} 
              alt="STS Admin" 
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-lg font-semibold text-white">STS Admin</h1>
        </div>

        {/* Right: Icons */}
        <div className="flex items-center gap-1">
          {/* Settings */}
          <button
            onClick={() => navigate('/settings')}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <Settings className="w-4 h-4 text-white/60" />
          </button>

          {/* Reminder Bell */}
          <div ref={reminderRef} className="relative">
            <button
              onClick={() => setShowReminders(!showReminders)}
              className="relative p-2 hover:bg-white/10 rounded-xl transition-colors"
            >
              <Bell className="w-4 h-4 text-white/60" />
              {reminderCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {reminderCount}
                </span>
              )}
            </button>

            {/* Reminder Dropdown */}
            {showReminders && (
              <div className="absolute right-0 mt-2 w-72 max-h-80 overflow-y-auto bg-[#1a1a1a] border border-white/10 rounded-xl p-2 z-50 shadow-xl">
                <div className="px-3 py-2 border-b border-white/10">
                  <p className="text-sm font-medium text-white/80">Reminders</p>
                </div>
                {reminders.length > 0 ? (
                  <div className="space-y-1 mt-1">
                    {reminders.map((reminder, index) => (
                      <button
                        key={index}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
                      >
                        <p className="text-sm text-white/80">{reminder.message}</p>
                        <p className="text-xs text-white/40 mt-0.5">{reminder.days} days remaining</p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-white/40 px-3 py-4 text-center">No upcoming reminders</p>
                )}
              </div>
            )}
          </div>

          {/* Connection Status */}
          <div ref={connectionRef} className="relative">
            <button
              onClick={() => setShowConnection(!showConnection)}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors relative"
            >
              <Zap className="w-4 h-4 text-green-400" />
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            </button>

            {/* Connection Dropdown */}
            {showConnection && (
              <div className="absolute right-0 mt-2 w-64 bg-[#1a1a1a] border border-white/10 rounded-xl p-2 z-50 shadow-xl">
                <div className="px-3 py-2 border-b border-white/10">
                  <p className="text-sm font-medium text-white/80">Connection Status</p>
                </div>
                <div className="px-3 py-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-white/80">Connection: OK</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-white/40" />
                    <span className="text-sm text-white/60">
                      Last sync: {formatDistanceToNow(lastSync, { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
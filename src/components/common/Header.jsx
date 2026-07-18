import { useState, useRef, useEffect } from 'react';
import { Bell, Settings, CheckCircle, Clock, LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/logo.png';

const Header = ({ reminders = [], lastSync = new Date(), isConnected = true }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showReminders, setShowReminders] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const reminderRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (reminderRef.current && !reminderRef.current.contains(event.target)) {
        setShowReminders(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const reminderCount = reminders.length;

  // Get user avatar URL or fallback
  const userAvatar = user?.picture || '';
  const userEmail = user?.email || 'User';
  const userName = user?.name || userEmail;

  return (
    <header className="sticky top-0 z-50">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left: Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center">
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
              <div className="absolute right-0 mt-2 w-72 max-h-80 overflow-y-auto dropdown-glass z-50 p-2">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-white/80">Reminders</p>
                </div>

                {/* Divider */}
                <div className="border-t border-white/10 my-1" style={{opacity: 0.25}} />

                {reminders.length > 0 ? (
                  <div className="space-y-1 mt-1">
                    {reminders.map((reminder, index) => (
                      <button
                        key={index}
                        className="dropdown-item"
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

          {/* User Avatar with Connection & Logout */}
          <div ref={userMenuRef} className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="relative p-1 hover:bg-white/10 rounded-full transition-colors"
            >
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt={userName}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
              {/* Connection status dot */}
              <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0a0a0a] ${
                isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'
              }`} />
            </button>

            {/* User Menu Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 dropdown-glass z-50 p-2">
                {/* User Info */}
                <div className="px-3 py-2">
                  <div className="flex items-center gap-3">
                    {userAvatar ? (
                      <img
                        src={userAvatar}
                        alt={userName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white/80 truncate">{userName}</p>
                      <p className="text-xs text-white/40 truncate">{userEmail}</p>
                    </div>
                  </div>
                </div>
                
                {/* Divider */}
                <div className="border-t border-white/10 my-1" style={{opacity: 0.25}} />

                {/* Connection Status */}
                <div className="px-3 py-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <CheckCircle className={`w-4 h-4 ${isConnected ? 'text-green-400' : 'text-red-400'}`} />
                    <span className={`text-sm ${isConnected ? 'text-white/80' : 'text-red-400'}`}>
                      Connection: {isConnected ? 'OK' : 'Error'}
                    </span>
                  </div>
                </div>
                
                {/* Logout Button */}
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
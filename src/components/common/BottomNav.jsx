import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, UserRound, Calendar } from 'lucide-react';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const navItems = [
    { icon: LayoutDashboard, label: 'Home', path: '/' },
    { icon: Users, label: 'Tutees', path: '/tutees' },
    { icon: UserRound, label: 'Tutors', path: '/tutors' },
    { icon: Calendar, label: 'Schedule', path: '/schedule' },
  ];

  return (
    <div className="fixed bottom-4 left-0 right-0 z-50 flex justify-center px-4">
        <div 
        className="w-full max-w-xs rounded-xl shadow-lg"
        style={{
            background: 'rgba(26, 26, 26, 0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '26px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            padding: '0 6px',
        }}
        >
        <div className="flex items-center justify-around px-2 py-1.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'text-purple-400' 
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''}`} />
                <span className="text-[9px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BottomNav;
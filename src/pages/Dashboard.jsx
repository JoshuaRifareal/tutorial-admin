import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserRound, Coins, Wallet, Calendar, Plus } from 'lucide-react';
import useTuteeStore from '../stores/tuteeStore';
import useTutorStore from '../stores/tutorStore';
import Header from '../components/common/Header';
import BottomNav from '../components/common/BottomNav';
import SearchBar from '../components/common/SearchBar';
import StatsCard from '../components/dashboard/StatsCard';
import PeriodDropdown from '../components/dashboard/PeriodDropdown';
import { format, differenceInDays, parseISO } from 'date-fns';

const Dashboard = () => {
  const navigate = useNavigate();
  const { tutees, isLoading: tuteesLoading, fetchTutees, error: tuteesError } = useTuteeStore();
  const { tutors, isLoading: tutorsLoading, fetchTutors, error: tutorsError } = useTutorStore();
  
  const [revenuePeriod, setRevenuePeriod] = useState('All');
  const [balancePeriod, setBalancePeriod] = useState('All');
  const [dataLoaded, setDataLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [lastSync, setLastSync] = useState(new Date());
  const fetchAttempted = useRef(false);

  useEffect(() => {
    if (fetchAttempted.current) return;
    fetchAttempted.current = true;
    
    const loadData = async () => {
      try {
        await Promise.all([
          fetchTutees(),
          fetchTutors()
        ]);
        setDataLoaded(true);
        setLastSync(new Date());
        console.log('Data loaded successfully!');
        console.log('Tutees:', tutees.length);
        console.log('Tutors:', tutors.length);
      } catch (error) {
        console.error('Failed to fetch from Google Sheets:', error);
        setHasError(true);
      }
    };
    loadData();
  }, [fetchTutees, fetchTutors]);

  const getReminders = () => {
    if (!dataLoaded || tutees.length === 0) return [];
    
    const now = new Date();
    const upcomingRenewals = tutees
      .filter(t => t.renewalDate && !t.isDeleted)
      .map(t => {
        const renewalDate = parseISO(t.renewalDate);
        const daysUntil = differenceInDays(renewalDate, now);
        return {
          ...t,
          daysUntil,
        };
      })
      .filter(t => t.daysUntil >= 0 && t.daysUntil <= 7)
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, 5);

    return upcomingRenewals.map(t => ({
      id: t.id,
      message: `${t.firstName} ${t.lastName} - Renewal in ${t.daysUntil} days`,
      days: t.daysUntil,
    }));
  };

  const reminders = getReminders();

  // Update the calculateRevenue function
  const calculateRevenue = (period) => {
    // Use tutees directly from store, not dataLoaded
    if (tutees.length === 0) return 0;
    
    const now = new Date();
    let startDate = new Date();
    
    const periodMap = {
      '7 days': 7,
      '30 days': 30,
      '90 days': 90,
      'All': 0,
    };
    
    const days = periodMap[period] || 0;
    if (days > 0) {
      startDate.setDate(now.getDate() - days);
    } else {
      startDate = new Date(0);
    }

    let totalRevenue = 0;
    tutees.forEach(tutee => {
      if (!tutee.isDeleted && tutee.paymentRecord && Array.isArray(tutee.paymentRecord)) {
        tutee.paymentRecord.forEach(payment => {
          try {
            const paymentDate = parseISO(payment.date);
            if (paymentDate >= startDate) {
              totalRevenue += parseFloat(payment.amount) || 0;
            }
          } catch (e) {
            // Skip invalid payment records
          }
        });
      }
    });

    return totalRevenue;
  };

  // Update the calculateBalance function
  const calculateBalance = (period) => {
    // Use tutees directly from store, not dataLoaded
    if (tutees.length === 0) return 0;
    
    const now = new Date();
    let startDate = new Date();
    
    const periodMap = {
      '7 days': 7,
      '30 days': 30,
      '90 days': 90,
      'All': 0,
    };
    
    const days = periodMap[period] || 0;
    if (days > 0) {
      startDate.setDate(now.getDate() - days);
    } else {
      startDate = new Date(0);
    }

    let totalBalance = 0;
    tutees.forEach(tutee => {
      if (!tutee.isDeleted && tutee.enrollmentDate) {
        try {
          const enrollmentDate = parseISO(tutee.enrollmentDate);
          if (enrollmentDate >= startDate) {
            totalBalance += tutee.balance || 0;
          }
        } catch (e) {
          // Skip invalid enrollment dates
        }
      }
    });

    return totalBalance;
  };

  const totalRevenue = calculateRevenue(revenuePeriod);
  const totalBalance = calculateBalance(balancePeriod);

  if (tuteesLoading || tutorsLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <Header reminders={reminders} lastSync={lastSync} isConnected={true} />
        <div className="container mx-auto px-4 py-4 pb-32">
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="glass-card p-4 animate-pulse">
                <div className="h-3 bg-white/10 rounded w-1/2 mb-2"></div>
                <div className="h-7 bg-white/10 rounded w-3/4"></div>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-4">
            <div className="glass-card p-6 animate-pulse">
              <div className="h-4 bg-white/10 rounded w-1/4 mb-3"></div>
              <div className="h-8 bg-white/10 rounded w-1/2"></div>
            </div>
            <div className="glass-card p-6 animate-pulse">
              <div className="h-4 bg-white/10 rounded w-1/4 mb-3"></div>
              <div className="h-8 bg-white/10 rounded w-1/2"></div>
            </div>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (hasError || tuteesError || tutorsError) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <Header reminders={[]} lastSync={lastSync} />
        <div className="container mx-auto px-4 py-8 pb-32">
          <div className="glass-card p-6 text-center">
            <p className="text-red-400 mb-4">⚠️ Error loading data</p>
            <p className="text-white/60 text-sm">{tuteesError || tutorsError || 'Failed to connect to Google Sheets'}</p>
            <button 
              onClick={() => window.location.reload()}
              className="btn-primary mt-4"
            >
              Retry
            </button>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  const activeTutees = tutees.filter(t => !t.isDeleted && t.status === 'active');
  const pendingTutees = tutees.filter(t => !t.isDeleted && t.status === 'pending');
  const totalTutees = tutees.filter(t => !t.isDeleted).length;
  const totalTutors = tutors.filter(t => !t.isDeleted).length;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Header reminders={reminders} lastSync={lastSync} />

      <div className="container mx-auto px-4 py-4 pb-32">
        <div className="w-full mb-4">
          <SearchBar />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <StatsCard
            title="Total Tutees"
            value={totalTutees}
            icon={Users}
            color="purple"
            onClick={() => navigate('/tutees')}
          />
          <StatsCard
            title="Active Tutees"
            value={activeTutees.length}
            icon={Users}
            color="green"
            trend={pendingTutees.length > 0 ? "up" : undefined}
            trendValue={`${pendingTutees.length} pending`}
            onClick={() => navigate('/tutees')}
          />
          <StatsCard
            title="Total Tutors"
            value={totalTutors}
            icon={UserRound}
            color="blue"
            onClick={() => navigate('/tutors')}
          />
          <StatsCard
            title="Renewals"
            value={reminders.length}
            icon={Calendar}
            color="orange"
            onClick={() => navigate('/tutees')}
          />
        </div>

        {/* Revenue Card with Plus Button */}
        <div className="glass-card p-4 mb-4">
          {/* Title row with period dropdown */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-emerald-400" />
              <h3 className="font-medium text-white/80">Revenue</h3>
            </div>
            <PeriodDropdown
              options={['7 days', '30 days', '90 days', 'All']}
              value={revenuePeriod}
              onChange={setRevenuePeriod}
            />
          </div>
          
          {/* Amount row with plus button */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-bold text-white">₱{totalRevenue.toLocaleString()}</p>
              <p className="text-sm text-white/40 mt-1">Total collected</p>
            </div>
            <button 
              className="flex items-center gap-1.5 px-3 py-3 my-2 rounded-xl transition-colors bg-white/5 hover:bg-white/10 text-white/60 hover:text-white"
              style={{
                minHeight: '44px',
                fontSize: '0.875rem',
                fontWeight: '500',
                backgroundColor: 'rgb(46, 46, 46)',
              }}
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        {/* Balance Card with Plus Button inline with amount */}
        <div className="glass-card p-4">
          {/* Title row with period dropdown */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-amber-400" />
              <h3 className="font-medium text-white/80">Outstanding Balance</h3>
            </div>
            <PeriodDropdown
              options={['7 days', '30 days', '90 days', 'All']}
              value={balancePeriod}
              onChange={setBalancePeriod}
            />
          </div>
          
          {/* Amount row with plus button */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-bold text-white">₱{totalBalance.toLocaleString()}</p>
              <p className="text-sm text-white/40 mt-1">Total unpaid</p>
            </div>
            <button 
              className="flex items-center gap-1.5 px-3 py-3 my-2 rounded-xl transition-colors bg-white/5 hover:bg-white/10 text-white/60 hover:text-white"
              style={{
                minHeight: '44px',
                fontSize: '0.875rem',
                fontWeight: '500',
                backgroundColor: 'rgb(46, 46, 46)',
              }}
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
        </div>

      </div>

      <BottomNav />
    </div>
  );
};

export default Dashboard;
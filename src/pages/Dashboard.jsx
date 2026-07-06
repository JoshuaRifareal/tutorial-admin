import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserRound, Coins, Wallet, Calendar } from 'lucide-react';
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
  
  const [revenuePeriod, setRevenuePeriod] = useState('30d');
  const [balancePeriod, setBalancePeriod] = useState('30d');
  const [dataLoaded, setDataLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [lastSync, setLastSync] = useState(new Date());
  const fetchAttempted = useRef(false);

  // Load data on mount - only once
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

  // Calculate reminders (renewals in next 7 days)
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

  // Calculate revenue based on period
  const calculateRevenue = (period) => {
    if (!dataLoaded || tutees.length === 0) return 0;
    
    const now = new Date();
    let startDate = new Date();
    
    switch(period) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      default:
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

  // Calculate balance based on period
  const calculateBalance = (period) => {
    if (!dataLoaded || tutees.length === 0) return 0;
    
    const now = new Date();
    let startDate = new Date();
    
    switch(period) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      default:
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

  // Show loading state
  if (tuteesLoading || tutorsLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <Header reminders={[]} lastSync={lastSync} />
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

  // Show error state
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
      {/* Sticky Header */}
      <Header reminders={reminders} lastSync={lastSync} />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-4 pb-32">
        {/* Search Bar - Full Width */}
        <div className="w-full mb-4">
          <SearchBar />
        </div>

        {/* Stats Cards - 2 columns on all devices */}
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
            title="Upcoming Renewals"
            value={reminders.length}
            icon={Calendar}
            color="orange"
            onClick={() => navigate('/tutees')}
          />
        </div>

        {/* Revenue Card */}
        <div className="glass-card p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-emerald-400" />
              <h3 className="font-medium text-white/80">Revenue</h3>
            </div>
            <PeriodDropdown
              options={['7d', '30d', '90d', 'All']}
              value={revenuePeriod}
              onChange={setRevenuePeriod}
            />
          </div>
          <p className="text-3xl font-bold text-white">₱{totalRevenue.toLocaleString()}</p>
          <p className="text-sm text-white/40 mt-1">Total collected</p>
        </div>

        {/* Balance Card */}
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-amber-400" />
              <h3 className="font-medium text-white/80">Outstanding Balance</h3>
            </div>
            <PeriodDropdown
              options={['7d', '30d', '90d', 'All']}
              value={balancePeriod}
              onChange={setBalancePeriod}
            />
          </div>
          <p className="text-3xl font-bold text-white">₱{totalBalance.toLocaleString()}</p>
          <p className="text-sm text-white/40 mt-1">Total unpaid</p>
        </div>
      </div>

      {/* Bottom Navigation - Floating */}
      <BottomNav />
    </div>
  );
};

export default Dashboard;
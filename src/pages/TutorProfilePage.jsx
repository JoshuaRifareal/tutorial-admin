import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import useTutorStore from '../stores/tutorStore';
import Header from '../components/common/Header';
import BottomNav from '../components/common/BottomNav';

const TutorProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tutors, isLoading, fetchTutors } = useTutorStore();

  useEffect(() => {
    fetchTutors();
  }, []);

  const tutor = tutors.find(t => t.id === id);

  if (isLoading || !tutor) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <Header />
        <div className="container mx-auto px-4 py-4 pb-32">
          <div className="animate-pulse glass-card p-6">
            <div className="h-8 bg-white/10 rounded w-1/4"></div>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Header />
      <div className="container max-w-2xl mx-auto px-4 py-4 pb-32">
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => navigate('/tutors')}
            className="flex items-center gap-2 text-white/60 hover:text-white/90 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Tutors</span>
          </button>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xl font-bold">
              {tutor.firstName?.[0]}{tutor.lastName?.[0]}
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                {tutor.firstName} {tutor.lastName}
              </h1>
              <p className="text-sm text-white/60">{tutor.school || '-'}</p>
              <p className="text-sm text-white/40">{tutor.program || '-'} · {tutor.major || '-'}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 glass-card p-5">
          <h3 className="text-sm font-medium text-white/80 mb-3">Assigned Tutees</h3>
          {tutor.tutees && tutor.tutees.length > 0 ? (
            <div className="space-y-2">
              {tutor.tutees.map((tuteeId, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm py-2 border-b border-white/5 last:border-0">
                  <span className="text-white/80">Tutee #{idx + 1}</span>
                  <span className="text-white/40 text-xs">ID: {tuteeId}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-white/40 text-center py-4">No assigned tutees</p>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default TutorProfilePage;
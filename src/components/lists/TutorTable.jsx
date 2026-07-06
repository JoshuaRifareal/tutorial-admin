import { useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';

const TutorTable = ({ tutors }) => {
  const navigate = useNavigate();

  if (tutors.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-white/40 text-sm">No tutors found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/5">
            <th className="text-left py-3 px-3 text-xs font-medium text-white/40">#</th>
            <th className="text-left py-3 px-3 text-xs font-medium text-white/40">Name</th>
            <th className="text-left py-3 px-3 text-xs font-medium text-white/40">School</th>
            <th className="text-left py-3 px-3 text-xs font-medium text-white/40">Program</th>
            <th className="text-left py-3 px-3 text-xs font-medium text-white/40">Major</th>
            <th className="text-center py-3 px-3 text-xs font-medium text-white/40">Tutees</th>
            <th className="text-right py-3 px-3 text-xs font-medium text-white/40">Actions</th>
          </tr>
        </thead>
        <tbody>
          {tutors.map((tutor, index) => (
            <tr 
              key={tutor.id} 
              className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
              onClick={() => navigate(`/tutor/${tutor.id}`)}
            >
              <td className="py-3 px-3 text-sm text-white/40">{index + 1}</td>
              <td className="py-3 px-3 text-sm text-white/80">
                {tutor.firstName} {tutor.lastName}
              </td>
              <td className="py-3 px-3 text-sm text-white/60">{tutor.school || '-'}</td>
              <td className="py-3 px-3 text-sm text-white/60">{tutor.program || '-'}</td>
              <td className="py-3 px-3 text-sm text-white/60">{tutor.major || '-'}</td>
              <td className="py-3 px-3 text-center text-sm text-white/60">
                {tutor.tutees?.length || 0}
              </td>
              <td className="py-3 px-3 text-right">
                <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => navigate(`/tutor/${tutor.id}`)}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/40 hover:text-white/70"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TutorTable;
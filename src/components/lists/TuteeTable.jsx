import { useNavigate } from 'react-router-dom';
import { Eye, Edit, Trash2 } from 'lucide-react';
import StatusChip from './StatusChip';

const TuteeTable = ({ tutees, tutors }) => {
  const navigate = useNavigate();

  const getTutorName = (tutorId) => {
    const tutor = tutors.find(t => t.id === tutorId);
    return tutor ? `${tutor.firstName} ${tutor.lastName}` : 'Unassigned';
  };

  if (tutees.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-white/40 text-sm">No tutees found</p>
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
            <th className="text-left py-3 px-3 text-xs font-medium text-white/40">Grade</th>
            <th className="text-left py-3 px-3 text-xs font-medium text-white/40">Tutor</th>
            <th className="text-left py-3 px-3 text-xs font-medium text-white/40">Package</th>
            <th className="text-left py-3 px-3 text-xs font-medium text-white/40">Status</th>
            <th className="text-right py-3 px-3 text-xs font-medium text-white/40">Actions</th>
          </tr>
        </thead>
        <tbody>
          {tutees.map((tutee, index) => (
            <tr 
              key={tutee.id} 
              className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
              onClick={() => navigate(`/tutee/${tutee.id}`)}
            >
              <td className="py-3 px-3 text-sm text-white/40">{index + 1}</td>
              <td className="py-3 px-3 text-sm text-white/80">
                {tutee.firstName} {tutee.lastName}
              </td>
              <td className="py-3 px-3 text-sm text-white/60">{tutee.gradeLevel || '-'}</td>
              <td className="py-3 px-3 text-sm text-white/60">{getTutorName(tutee.tutorId)}</td>
              <td className="py-3 px-3 text-sm text-white/60">{tutee.package || '-'}</td>
              <td className="py-3 px-3">
                <StatusChip status={tutee.status} />
              </td>
              <td className="py-3 px-3 text-right">
                <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => navigate(`/tutee/${tutee.id}`)}
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

export default TuteeTable;
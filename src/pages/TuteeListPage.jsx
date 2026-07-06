import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import useTuteeStore from '../stores/tuteeStore';
import useTutorStore from '../stores/tutorStore';
import useUIStore from '../stores/uiStore';
import Header from '../components/common/Header';
import BottomNav from '../components/common/BottomNav';
import SearchBar from '../components/common/SearchBar';
import StatusChip from '../components/lists/StatusChip';
import ColumnHeader from '../components/lists/ColumnHeader';
import Pagination from '../components/lists/Pagination';

const TuteeListPage = () => {
  const navigate = useNavigate();
  const { tutees, isLoading, fetchTutees } = useTuteeStore();
  const { tutors, fetchTutors } = useTutorStore();
  const { searchQuery } = useUIStore();
  
  const [gradeFilter, setGradeFilter] = useState('all');
  const [tutorFilter, setTutorFilter] = useState('all');
  const [packageFilter, setPackageFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortDirection, setSortDirection] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchTutees();
    fetchTutors();
  }, []);

  const getTutorName = (tutorId) => {
    const tutor = tutors.find(t => t.id === tutorId);
    return tutor ? `${tutor.firstName} ${tutor.lastName}` : 'Unassigned';
  };

  const getFilterOptions = (field) => {
    const counts = {};
    const allCount = tutees.length;
    
    tutees.forEach(t => {
      let key = t[field];
      if (field === 'tutor') {
        key = t.tutorId;
      }
      if (key) {
        counts[key] = (counts[key] || 0) + 1;
      }
    });

    const options = [{ value: 'all', label: 'All', count: allCount }];
    
    if (field === 'tutor') {
      tutors.forEach(tutor => {
        const count = counts[tutor.id] || 0;
        if (count > 0) {
          options.push({
            value: tutor.id,
            label: `${tutor.firstName} ${tutor.lastName}`,
            count,
          });
        }
      });
    } else {
      Object.entries(counts)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .forEach(([key, count]) => {
          options.push({ value: key, label: key, count });
        });
    }
    
    return options;
  };

  const filteredTutees = useMemo(() => {
    let result = [...tutees];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t => 
        `${t.firstName} ${t.lastName}`.toLowerCase().includes(query) ||
        t.gradeLevel?.toLowerCase().includes(query) ||
        t.school?.toLowerCase().includes(query)
      );
    }
    
    if (gradeFilter !== 'all') {
      result = result.filter(t => t.gradeLevel === gradeFilter);
    }
    
    if (tutorFilter !== 'all') {
      result = result.filter(t => t.tutorId === tutorFilter);
    }
    
    if (packageFilter !== 'all') {
      result = result.filter(t => t.package === packageFilter);
    }
    
    if (statusFilter !== 'all') {
      result = result.filter(t => t.status === statusFilter);
    }
    
    if (sortDirection === 'asc') {
      result.sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`));
    } else if (sortDirection === 'desc') {
      result.sort((a, b) => `${b.firstName} ${b.lastName}`.localeCompare(`${a.firstName} ${a.lastName}`));
    }
    
    return result;
  }, [tutees, searchQuery, gradeFilter, tutorFilter, packageFilter, statusFilter, sortDirection]);

  const totalPages = Math.ceil(filteredTutees.length / itemsPerPage);
  const paginatedTutees = filteredTutees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, gradeFilter, tutorFilter, packageFilter, statusFilter, sortDirection]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <Header />
        <div className="container mx-auto px-4 py-4 pb-32">
          <div className="glass-card p-6 animate-pulse">
            <div className="h-8 bg-white/10 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-white/10 rounded"></div>
              ))}
            </div>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Header />
      
      <div className="container mx-auto px-4 py-4 pb-32">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">All Tutees</h2>
          <button className="btn-primary text-xs px-2 py-1.5 flex items-center gap-1">
            <Plus className="w-3 h-3" />
            Add Tutee
          </button>
        </div>

        <div className="mb-4">
          <SearchBar />
        </div>

        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-0">
                  <th className="text-left py-3 px-3 text-xs font-medium text-white/40 w-12 border-0">#</th>
                  <th className="text-left py-3 px-3 border-0">
                    <ColumnHeader
                      label="Name"
                      type="sort"
                      sortDirection={sortDirection}
                      onSortToggle={(direction) => setSortDirection(direction)}
                    />
                  </th>
                  <th className="text-left py-3 px-3 border-0">
                    <ColumnHeader
                      label="Grade"
                      type="filter"
                      options={getFilterOptions('gradeLevel')}
                      value={gradeFilter}
                      onChange={setGradeFilter}
                    />
                  </th>
                  <th className="text-left py-3 px-3 border-0">
                    <ColumnHeader
                      label="Tutor"
                      type="filter"
                      options={getFilterOptions('tutor')}
                      value={tutorFilter}
                      onChange={setTutorFilter}
                    />
                  </th>
                  <th className="text-left py-3 px-3 border-0">
                    <ColumnHeader
                      label="Package"
                      type="filter"
                      options={getFilterOptions('package')}
                      value={packageFilter}
                      onChange={setPackageFilter}
                    />
                  </th>
                  <th className="text-left py-3 px-3 border-0">
                    <ColumnHeader
                      label="Status"
                      type="filter"
                      options={getFilterOptions('status')}
                      value={statusFilter}
                      onChange={setStatusFilter}
                    />
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedTutees.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-white/40 text-sm border-0">
                      No tutees found
                    </td>
                  </tr>
                ) : (
                  paginatedTutees.map((tutee, index) => (
                    <tr 
                      key={tutee.id} 
                      className="border-0 hover:bg-white/5 transition-colors cursor-pointer"
                      onClick={() => navigate(`/tutee/${tutee.id}`)}
                    >
                      <td className="py-3 px-3 text-sm text-white/40 border-0">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </td>
                      <td className="py-3 px-3 text-sm text-white/80 border-0">
                        {tutee.firstName} {tutee.lastName}
                      </td>
                      <td className="py-3 px-3 text-sm text-white/60 border-0">{tutee.gradeLevel || '-'}</td>
                      <td className="py-3 px-3 text-sm text-white/60 border-0">{getTutorName(tutee.tutorId)}</td>
                      <td className="py-3 px-3 text-sm text-white/60 border-0">{tutee.package || '-'}</td>
                      <td className="py-3 px-3 border-0">
                        <StatusChip status={tutee.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filteredTutees.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-white/40">
            Showing {paginatedTutees.length} of {filteredTutees.length} tutees
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default TuteeListPage;
import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import useTutorStore from '../stores/tutorStore';
import useTuteeStore from '../stores/tuteeStore';
import useUIStore from '../stores/uiStore';
import Header from '../components/common/Header';
import BottomNav from '../components/common/BottomNav';
import SearchBar from '../components/common/SearchBar';
import ColumnHeader from '../components/lists/ColumnHeader';
import Pagination from '../components/lists/Pagination';

const TutorListPage = () => {
  const navigate = useNavigate();
  const { tutors, isLoading, fetchTutors } = useTutorStore();
  const { tutees, fetchTutees } = useTuteeStore();
  const { searchQuery } = useUIStore();
  
  const [schoolFilter, setSchoolFilter] = useState('all');
  const [programFilter, setProgramFilter] = useState('all');
  const [majorFilter, setMajorFilter] = useState('all');
  const [sortDirection, setSortDirection] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchTutors();
    fetchTutees();
  }, []);

  const getTuteeNames = (tuteeIds) => {
    if (!tuteeIds || tuteeIds.length === 0) return '-';
    const names = tuteeIds
      .map(id => {
        const tutee = tutees.find(t => t.id === id);
        return tutee ? tutee.firstName : null;
      })
      .filter(Boolean);
    return names.length > 0 ? names.join(', ') : '-';
  };

  const getFilterOptions = (field) => {
    const counts = {};
    const allCount = tutors.length;
    
    tutors.forEach(t => {
      const key = t[field];
      if (key) {
        counts[key] = (counts[key] || 0) + 1;
      }
    });

    const options = [{ value: 'all', label: 'All', count: allCount }];
    Object.entries(counts)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .forEach(([key, count]) => {
        options.push({ value: key, label: key, count });
      });
    
    return options;
  };

  const filteredTutors = useMemo(() => {
    let result = [...tutors];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t => 
        `${t.firstName} ${t.lastName}`.toLowerCase().includes(query) ||
        t.school?.toLowerCase().includes(query) ||
        t.major?.toLowerCase().includes(query)
      );
    }
    
    if (schoolFilter !== 'all') {
      result = result.filter(t => t.school === schoolFilter);
    }
    
    if (programFilter !== 'all') {
      result = result.filter(t => t.program === programFilter);
    }
    
    if (majorFilter !== 'all') {
      result = result.filter(t => t.major === majorFilter);
    }
    
    if (sortDirection === 'asc') {
      result.sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`));
    } else if (sortDirection === 'desc') {
      result.sort((a, b) => `${b.firstName} ${b.lastName}`.localeCompare(`${a.firstName} ${a.lastName}`));
    }
    
    return result;
  }, [tutors, searchQuery, schoolFilter, programFilter, majorFilter, sortDirection]);

  const totalPages = Math.ceil(filteredTutors.length / itemsPerPage);
  const paginatedTutors = filteredTutors.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, schoolFilter, programFilter, majorFilter, sortDirection]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <Header />
        <div className="container mx-auto px-4 py-4 pb-32">
          <div className="glass-card p-6 animate-pulse">
            <div className="h-8 bg-white/10 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
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
          <h2 className="text-lg font-semibold text-white">All Tutors</h2>
          <button className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1">
            <Plus className="w-3 h-3" />
            Add Tutor
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
                      label="School"
                      type="filter"
                      options={getFilterOptions('school')}
                      value={schoolFilter}
                      onChange={setSchoolFilter}
                    />
                  </th>
                  <th className="text-left py-3 px-3 border-0">
                    <ColumnHeader
                      label="Program"
                      type="filter"
                      options={getFilterOptions('program')}
                      value={programFilter}
                      onChange={setProgramFilter}
                    />
                  </th>
                  <th className="text-left py-3 px-3 border-0">
                    <ColumnHeader
                      label="Major"
                      type="filter"
                      options={getFilterOptions('major')}
                      value={majorFilter}
                      onChange={setMajorFilter}
                    />
                  </th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-white/40 border-0">
                    Tutees
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedTutors.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-white/40 text-sm border-0">
                      No tutors found
                    </td>
                  </tr>
                ) : (
                  paginatedTutors.map((tutor, index) => (
                    <tr 
                      key={tutor.id} 
                      className="border-0 hover:bg-white/5 transition-colors cursor-pointer"
                      onClick={() => navigate(`/tutor/${tutor.id}`)}
                    >
                      <td className="py-3 px-3 text-sm text-white/40 border-0">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </td>
                      <td className="py-3 px-3 text-sm text-white/80 border-0">
                        {tutor.firstName} {tutor.lastName}
                      </td>
                      <td className="py-3 px-3 text-sm text-white/60 border-0">{tutor.school || '-'}</td>
                      <td className="py-3 px-3 text-sm text-white/60 border-0">{tutor.program || '-'}</td>
                      <td className="py-3 px-3 text-sm text-white/60 border-0">{tutor.major || '-'}</td>
                      <td className="py-3 px-3 text-sm text-white/60 border-0">
                        {getTuteeNames(tutor.tutees)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filteredTutors.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-white/40">
            Showing {paginatedTutors.length} of {filteredTutors.length} tutors
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default TutorListPage;
import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Minus, Trash2, X } from 'lucide-react';
import useTutorStore from '../stores/tutorStore';
import useTuteeStore from '../stores/tuteeStore';
import useUIStore from '../stores/uiStore';
import Header from '../components/common/Header';
import BottomNav from '../components/common/BottomNav';
import SearchBar from '../components/common/SearchBar';
import ColumnHeader from '../components/lists/ColumnHeader';
import Pagination from '../components/lists/Pagination';
import ModalityPill from '../components/common/ModalityPill';

const TutorListPage = () => {
  const navigate = useNavigate();
  const { tutors, isLoading, fetchTutors, addTutor, deleteTutor } = useTutorStore();
  const { tutees, fetchTutees } = useTuteeStore();
  const { searchQuery } = useUIStore();
  
  const [schoolFilter, setSchoolFilter] = useState('all');
  const [programFilter, setProgramFilter] = useState('all');
  const [majorFilter, setMajorFilter] = useState('all');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Add tutor states
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTutorId, setNewTutorId] = useState(null);
  const [newTutor, setNewTutor] = useState({
    firstName: '',
    lastName: '',
    school: '',
    program: '',
    major: '',
  });

  // Remove tutor states
  const [removeMode, setRemoveMode] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Get unique modalities from assigned tutees:
  const getTuteeModalities = (tuteeIds) => {
    if (!tuteeIds || tuteeIds.length === 0) return [];
    const modalities = new Set();
    tuteeIds.forEach(id => {
      const tutee = tutees.find(t => t.id === id);
      if (tutee && tutee.modality) {
        modalities.add(tutee.modality);
      }
    });
    return Array.from(modalities);
  };

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

  // Get full name for display: "LastName, FirstName"
  const getFullName = (tutor) => {
    return `${tutor.lastName || ''}, ${tutor.firstName || ''}`;
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
    
    if (sortDirection) {
      result.sort((a, b) => {
        const nameA = `${a.lastName || ''} ${a.firstName || ''}`;
        const nameB = `${b.lastName || ''} ${b.firstName || ''}`;
        return sortDirection === 'asc' 
          ? nameA.localeCompare(nameB) 
          : nameB.localeCompare(nameA);
      });
    }
    
    if (newTutorId) {
      const newEntryIndex = result.findIndex(t => t.id === newTutorId);
      if (newEntryIndex > 0) {
        const [newEntry] = result.splice(newEntryIndex, 1);
        result.unshift(newEntry);
      }
    }
    
    return result;
  }, [tutors, searchQuery, schoolFilter, programFilter, majorFilter, sortDirection, newTutorId]);

  const totalPages = Math.ceil(filteredTutors.length / itemsPerPage);
  const paginatedTutors = filteredTutors.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, schoolFilter, programFilter, majorFilter, sortDirection, newTutorId]);

  // Add tutor handlers
  const handleAddNew = () => {
    setIsAdding(true);
    setNewTutor({
      firstName: '',
      lastName: '',
      school: '',
      program: '',
      major: '',
    });
    setNewTutorId(null);
    setRemoveMode(false);
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
    setNewTutor({
      firstName: '',
      lastName: '',
      school: '',
      program: '',
      major: '',
    });
    setNewTutorId(null);
  };

  const handleSaveNew = async () => {
    if (!newTutor.firstName || !newTutor.lastName) {
      alert('Please fill in at least First Name and Last Name');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const newEntry = await addTutor({
        firstName: newTutor.firstName,
        lastName: newTutor.lastName,
        school: newTutor.school || '',
        program: newTutor.program || '',
        major: newTutor.major || '',
      });
      
      setIsAdding(false);
      setNewTutor({
        firstName: '',
        lastName: '',
        school: '',
        program: '',
        major: '',
      });
      
      if (newEntry && newEntry.id) {
        setNewTutorId(newEntry.id);
        setTimeout(() => {
          setNewTutorId(null);
        }, 3000);
      }
      
      await fetchTutors();
    } catch (error) {
      console.error('Failed to add tutor:', error);
      alert('Failed to add tutor. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Remove tutor handlers
  const handleRemoveModeToggle = () => {
    setRemoveMode(!removeMode);
  };

  const handleRemoveClick = (tutor) => {
    setSelectedTutor(tutor);
    setShowRemoveModal(true);
  };

  const handleConfirmRemove = async () => {
    if (!selectedTutor) return;
    setIsDeleting(true);
    try {
      await deleteTutor(selectedTutor.id);
      setShowRemoveModal(false);
      setSelectedTutor(null);
      await fetchTutors();
    } catch (error) {
      console.error('Failed to delete tutor:', error);
      alert('Failed to delete tutor. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelRemove = () => {
    setShowRemoveModal(false);
    setSelectedTutor(null);
  };

  // Handle manual sort
  const handleSortToggle = (direction) => {
    setSortDirection(direction);
    setNewTutorId(null);
  };

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
        {/* Header with Add and Remove Buttons */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">All Tutors</h2>
          <div className="flex items-center gap-2">
            {!isAdding && (
              <>
                <button 
                  onClick={handleAddNew}
                  className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Add
                </button>
                <button
                  onClick={handleRemoveModeToggle}
                  className={`flex items-center gap-1 text-xs px-3 py-2 rounded-xl transition-colors ${
                    removeMode 
                      ? 'text-white hover:bg-red-500/30' 
                      : 'text-white/70 hover:text-white'
                  }`}
                  style={{
                    backgroundColor: removeMode 
                      ? 'rgba(239, 68, 68, 0.2)' 
                      : 'rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <Minus className="w-3 h-3" />
                  {removeMode ? 'Cancel' : 'Remove'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <SearchBar />
        </div>

        {/* Add Tutor Form Card */}
        {isAdding && (
          <div className="glass-card p-4 mb-4">
            <div className="grid grid-cols-2 gap-3">
              {/* Row 1: First Name + Last Name */}
              <div className="col-span-1">
                <span className="text-[10px] text-white/40 block mb-0.5">First Name</span>
                <input
                  type="text"
                  value={newTutor.firstName}
                  onChange={(e) => setNewTutor(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="First Name"
                  className="input-dark w-full"
                />
              </div>
              <div className="col-span-1">
                <span className="text-[10px] text-white/40 block mb-0.5">Last Name</span>
                <input
                  type="text"
                  value={newTutor.lastName}
                  onChange={(e) => setNewTutor(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Last Name"
                  className="input-dark w-full"
                />
              </div>
              
              {/* Row 2: School (100%) */}
              <div className="col-span-2">
                <span className="text-[10px] text-white/40 block mb-0.5">School</span>
                <input
                  type="text"
                  value={newTutor.school}
                  onChange={(e) => setNewTutor(prev => ({ ...prev, school: e.target.value }))}
                  placeholder="School"
                  className="input-dark w-full"
                />
              </div>
              
              {/* Row 3: Program (70%) + Major (30%) */}
              <div className="col-span-2 grid grid-cols-7 gap-3">
                <div className="col-span-5">
                  <span className="text-[10px] text-white/40 block mb-0.5">Program</span>
                  <input
                    type="text"
                    value={newTutor.program}
                    onChange={(e) => setNewTutor(prev => ({ ...prev, program: e.target.value }))}
                    placeholder="Program"
                    className="input-dark w-full"
                  />
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] text-white/40 block mb-0.5">Major</span>
                  <input
                    type="text"
                    value={newTutor.major}
                    onChange={(e) => setNewTutor(prev => ({ ...prev, major: e.target.value }))}
                    placeholder="Major"
                    className="input-dark w-full"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleSaveNew}
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleCancelAdd}
                className="flex-1 flex items-center justify-center text-xs px-3 py-1.5 rounded-lg text-white/40 hover:text-white/60 transition-colors"
                style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-0">
                  <th className="text-left py-3 px-3 text-xs font-medium text-white/40 w-12 border-0">#</th>
                  {removeMode && (
                    <th className="text-left py-3 px-3 text-xs font-medium text-white/40 border-0 w-12">Action</th>
                  )}
                  <th className="text-left py-3 px-3 border-0">
                    <ColumnHeader
                      label="Name"
                      type="sort"
                      sortDirection={sortDirection}
                      onSortToggle={handleSortToggle}
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
                    Modality
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedTutors.length === 0 ? (
                  <tr>
                    <td colSpan={removeMode ? 7 : 6} className="text-center py-12 text-white/40 text-sm border-0">
                      No tutors found
                    </td>
                  </tr>
                ) : (
                  paginatedTutors.map((tutor, index) => {
                    const isNewEntry = tutor.id === newTutorId;
                    return (
                      <tr 
                        key={tutor.id} 
                        className={`border-0 hover:bg-white/5 transition-colors cursor-pointer ${isNewEntry ? 'pulse-green' : ''}`}
                        onClick={() => navigate(`/tutor/${tutor.id}`)}
                        style={{
                          backgroundColor: isNewEntry ? 'rgba(34, 197, 94, 0.05)' : 'transparent',
                          borderLeft: isNewEntry ? '2px solid #4ade80' : 'none',
                          transition: 'all 0.3s ease',
                        }}
                      >
                        {/* # Column */}
                        <td className="py-3 px-3 text-sm text-white/40 border-0">
                          {(currentPage - 1) * itemsPerPage + index + 1}
                        </td>
                        
                        {/* Action Column (only in remove mode) */}
                        {removeMode && (
                          <td className="py-3 px-3 border-0 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveClick(tutor);
                              }}
                              className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                        
                        <td className="py-3 px-3 text-sm text-white/80 border-0">
                          {getFullName(tutor)}
                        </td>
                        <td className="py-3 px-3 text-sm text-white/60 border-0">{tutor.school || '-'}</td>
                        <td className="py-3 px-3 text-sm text-white/60 border-0">{tutor.program || '-'}</td>
                        <td className="py-3 px-3 text-sm text-white/60 border-0">{tutor.major || '-'}</td>
                        <td className="py-3 px-3 text-sm text-white/60 border-0">
                          {(() => {
                            const modalities = getTuteeModalities(tutor.tutees);
                            return modalities.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {modalities.map((mod, idx) => (
                                  <ModalityPill key={idx} modality={mod} />
                                ))}
                              </div>
                            ) : (
                              <span className="text-white/30 text-xs">-</span>
                            );
                          })()}
                        </td>
                      </tr>
                    );
                  })
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

        {/* Result count */}
        <div className="mt-4 text-center">
          <p className="text-xs text-white/40">
            Showing {paginatedTutors.length} of {filteredTutors.length} tutors
          </p>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showRemoveModal && selectedTutor && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div 
            className="w-full max-w-md mx-4 p-6 rounded-xl"
            style={{
              backgroundColor: '#1a1a1a',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">⚠️ Remove Tutor?</h3>
              <button
                onClick={handleCancelRemove}
                className="text-white/40 hover:text-white/80 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-sm text-white/60 mb-2">
              Are you sure you want to remove <span className="text-white/80 font-medium">{getFullName(selectedTutor)}</span>?
            </p>
            <p className="text-sm text-white/40 mb-6">
              This action cannot be undone.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={handleCancelRemove}
                className="flex-1 px-4 py-2 rounded-lg text-sm text-white/60 hover:bg-white/10 transition-colors"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRemove}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 rounded-lg text-sm bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default TutorListPage;
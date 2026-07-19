import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Minus, Trash2, X, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import useTuteeStore from '../stores/tuteeStore';
import useTutorStore from '../stores/tutorStore';
import useUIStore from '../stores/uiStore';
import Header from '../components/common/Header';
import BottomNav from '../components/common/BottomNav';
import SearchBar from '../components/common/SearchBar';
import StatusChip from '../components/lists/StatusChip';
import ColumnHeader from '../components/lists/ColumnHeader';
import Pagination from '../components/lists/Pagination';
import Select from '../components/common/Select';
import DatePicker from '../components/common/DatePicker';
import ModalityPill from '../components/common/ModalityPill';
import { format, parseISO } from 'date-fns';

const TuteeListPage = () => {
  const navigate = useNavigate();
  const { tutees, isLoading, fetchTutees, addTutee, deleteTutee } = useTuteeStore();
  const { tutors, fetchTutors } = useTutorStore();
  const { searchQuery } = useUIStore();
  
  const [gradeFilter, setGradeFilter] = useState('all');
  const [schoolFilter, setSchoolFilter] = useState('all');
  const [tutorFilter, setTutorFilter] = useState('all');
  const [modalityFilter, setModalityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [gcFilter, setGcFilter] = useState('all');
  const [afFilter, setAfFilter] = useState('all');
  const [polFilter, setPolFilter] = useState('all');
  
  // Sort states
  const [sortDirection, setSortDirection] = useState('asc');
  const [enrollmentSort, setEnrollmentSort] = useState(null);
  const [startSort, setStartSort] = useState(null);
  const [endSort, setEndSort] = useState(null);
  const [balanceSort, setBalanceSort] = useState(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Add tutee states
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTuteeId, setNewTuteeId] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const formRef = useRef(null);
  const [newTutee, setNewTutee] = useState({
    firstName: '',
    lastName: '',
    gradeLevel: '',
    school: '',
    tutorId: '',
    modality: '',
    package: '20',
    status: 'Pending',
    enrollmentDate: new Date().toISOString().split('T')[0],
    startDate: new Date().toISOString().split('T')[0],
    hours: 1,
    rate: '',
  });

  // Remove tutee states
  const [removeMode, setRemoveMode] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [selectedTutee, setSelectedTutee] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Modality dropdown options 
  const modalityOptions = [
    { value: 'F2F', label: 'F2F' },
    { value: 'ON', label: 'ON' },
    { value: 'HB', label: 'HB' },
  ];

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
    } else if (['isInGroupChat', 'hasAdmissionForm', 'hasPolicies'].includes(field)) {
      const trueCount = tutees.filter(t => t[field] === true).length;
      const falseCount = tutees.filter(t => t[field] === false).length;
      return [
        { value: 'all', label: 'All', count: allCount },
        { value: 'true', label: 'Yes', count: trueCount },
        { value: 'false', label: 'No', count: falseCount },
      ];
    } else {
      Object.entries(counts)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .forEach(([key, count]) => {
          options.push({ value: key, label: key, count });
        });
    }
    
    return options;
  };

  // Get full name for display: "LastName, FirstName"
  const getFullName = (tutee) => {
    return `${tutee.lastName || ''}, ${tutee.firstName || ''}`;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return format(parseISO(dateString), 'MMM d, yyyy');
    } catch {
      return '-';
    }
  };

  // Calculate end date (20 weekdays from start date)
  const calculateEndDate = (startDate) => {
    if (!startDate) return '';
    const date = new Date(startDate);
    let daysAdded = 0;
    while (daysAdded < 20) {
      date.setDate(date.getDate() + 1);
      const dayOfWeek = date.getDay();
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        daysAdded++;
      }
    }
    return date.toISOString().split('T')[0];
  };

  // Calculate balance (rate * package)
  const calculateBalance = (rate, packageHours) => {
    if (!rate || !packageHours) return 0;
    return rate * parseInt(packageHours);
  };

  // Sort toggle functions
  const toggleNameSort = () => {
    if (sortDirection === 'asc') setSortDirection('desc');
    else if (sortDirection === 'desc') setSortDirection(null);
    else setSortDirection('asc');
    setNewTuteeId(null);
  };

  const toggleEnrollmentSort = () => {
    if (enrollmentSort === 'asc') setEnrollmentSort('desc');
    else if (enrollmentSort === 'desc') setEnrollmentSort(null);
    else setEnrollmentSort('asc');
  };

  const toggleStartSort = () => {
    if (startSort === 'asc') setStartSort('desc');
    else if (startSort === 'desc') setStartSort(null);
    else setStartSort('asc');
  };

  const toggleEndSort = () => {
    if (endSort === 'asc') setEndSort('desc');
    else if (endSort === 'desc') setEndSort(null);
    else setEndSort('asc');
  };

  const toggleBalanceSort = () => {
    if (balanceSort === 'asc') setBalanceSort('desc');
    else if (balanceSort === 'desc') setBalanceSort(null);
    else setBalanceSort('asc');
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
    
    if (schoolFilter !== 'all') {
      result = result.filter(t => t.school === schoolFilter);
    }
    
    if (tutorFilter !== 'all') {
      result = result.filter(t => t.tutorId === tutorFilter);
    }
    
    if (modalityFilter !== 'all') {
      result = result.filter(t => t.modality === modalityFilter);
    }
    
    if (gcFilter !== 'all') {
      const val = gcFilter === 'true';
      result = result.filter(t => t.isInGroupChat === val);
    }
    
    if (afFilter !== 'all') {
      const val = afFilter === 'true';
      result = result.filter(t => t.hasAdmissionForm === val);
    }
    
    if (polFilter !== 'all') {
      const val = polFilter === 'true';
      result = result.filter(t => t.hasPolicies === val);
    }
    
    if (statusFilter !== 'all') {
      result = result.filter(t => t.status?.toLowerCase() === statusFilter.toLowerCase());
    }
    
    // Name Sort
    if (sortDirection) {
      result.sort((a, b) => {
        const nameA = `${a.lastName || ''} ${a.firstName || ''}`;
        const nameB = `${b.lastName || ''} ${b.firstName || ''}`;
        return sortDirection === 'asc' 
          ? nameA.localeCompare(nameB) 
          : nameB.localeCompare(nameA);
      });
    }
    
    // Enrollment Sort
    if (enrollmentSort) {
      result.sort((a, b) => {
        const dateA = a.enrollmentDate ? new Date(a.enrollmentDate) : new Date(0);
        const dateB = b.enrollmentDate ? new Date(b.enrollmentDate) : new Date(0);
        return enrollmentSort === 'asc' ? dateA - dateB : dateB - dateA;
      });
    }
    
    // Start Date Sort
    if (startSort) {
      result.sort((a, b) => {
        const dateA = a.startDate ? new Date(a.startDate) : new Date(0);
        const dateB = b.startDate ? new Date(b.startDate) : new Date(0);
        return startSort === 'asc' ? dateA - dateB : dateB - dateA;
      });
    }
    
    // End Date Sort
    if (endSort) {
      result.sort((a, b) => {
        const dateA = a.endDate ? new Date(a.endDate) : new Date(0);
        const dateB = b.endDate ? new Date(b.endDate) : new Date(0);
        return endSort === 'asc' ? dateA - dateB : dateB - dateA;
      });
    }
    
    // Balance Sort
    if (balanceSort) {
      result.sort((a, b) => {
        const balA = a.balance || 0;
        const balB = b.balance || 0;
        return balanceSort === 'asc' ? balA - balB : balB - balA;
      });
    }
    
    // New entry at top
    if (newTuteeId) {
      const newEntryIndex = result.findIndex(t => t.id === newTuteeId);
      if (newEntryIndex > 0) {
        const [newEntry] = result.splice(newEntryIndex, 1);
        result.unshift(newEntry);
      }
    }
    
    return result;
  }, [
    tutees, 
    searchQuery, 
    gradeFilter, 
    schoolFilter, 
    tutorFilter, 
    modalityFilter, 
    gcFilter, 
    afFilter, 
    polFilter, 
    statusFilter, 
    sortDirection,
    enrollmentSort,
    startSort,
    endSort,
    balanceSort,
    newTuteeId
  ]);

  const totalPages = Math.ceil(filteredTutees.length / itemsPerPage);
  const paginatedTutees = filteredTutees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery, 
    gradeFilter, 
    schoolFilter, 
    tutorFilter, 
    modalityFilter, 
    gcFilter, 
    afFilter, 
    polFilter, 
    statusFilter, 
    sortDirection,
    enrollmentSort,
    startSort,
    endSort,
    balanceSort,
    newTuteeId
  ]);

  // Validation
  const validateForm = () => {
    const errors = {};
    
    if (!newTutee.firstName) errors.firstName = 'First Name is required';
    if (!newTutee.lastName) errors.lastName = 'Last Name is required';
    if (!newTutee.gradeLevel) errors.gradeLevel = 'Grade is required';
    if (!newTutee.school) errors.school = 'School is required';
    if (!newTutee.tutorId) errors.tutorId = 'Tutor is required';
    if (!newTutee.enrollmentDate) errors.enrollmentDate = 'Enrollment Date is required';
    if (!newTutee.startDate) errors.startDate = 'Start Date is required';
    if (!newTutee.hours) errors.hours = 'Hours is required';
    if (!newTutee.rate || newTutee.rate <= 0) errors.rate = 'Rate is required';
    if (!newTutee.package) errors.package = 'Package is required';
    if (!newTutee.status) errors.status = 'Status is required';
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Add tutee handlers
  const handleAddNew = () => {
    setIsAdding(true);
    setNewTutee({
      firstName: '',
      lastName: '',
      gradeLevel: '',
      school: '',
      tutorId: '',
      modality: '',
      enrollmentDate: new Date().toISOString().split('T')[0],
      startDate: new Date().toISOString().split('T')[0],
      hours: 1,
      rate: '',
      package: '20',
      status: 'Pending',
    });
    setNewTuteeId(null);
    setFieldErrors({});
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
    setNewTutee({
      firstName: '',
      lastName: '',
      gradeLevel: '',
      school: '',
      tutorId: '',
      modality: '',
      enrollmentDate: new Date().toISOString().split('T')[0],
      startDate: new Date().toISOString().split('T')[0],
      hours: 1,
      rate: '',
      package: '20',
      status: 'Pending',
    });
    setNewTuteeId(null);
    setFieldErrors({});
  };

  const handleSaveNew = async () => {
    if (!validateForm()) {
      if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const firstErrorField = Object.keys(fieldErrors)[0];
        if (firstErrorField) {
          const element = document.getElementById(`field-${firstErrorField}`);
          if (element) {
            setTimeout(() => element.focus(), 300);
          }
        }
      }
      setTimeout(() => {
        setFieldErrors({});
      }, 3000);
      return;
    }
    
    setIsSubmitting(true);
    try {
      const newEntry = await addTutee({
        firstName: newTutee.firstName,
        lastName: newTutee.lastName,
        gradeLevel: newTutee.gradeLevel,
        school: newTutee.school,
        tutorId: newTutee.tutorId,
        modality: newTutee.modality || '',
        enrollmentDate: newTutee.enrollmentDate,
        startDate: newTutee.startDate,
        endDate: calculateEndDate(newTutee.startDate),
        renewalDate: calculateEndDate(newTutee.startDate),
        hoursPerSession: parseFloat(newTutee.hours),
        rate: parseFloat(newTutee.rate),
        package: newTutee.package,
        status: newTutee.status || 'Pending',
        balance: calculateBalance(parseFloat(newTutee.rate), newTutee.package),
        paymentRecord: [],
        schedule: {},
        isInGroupChat: false,
        hasAdmissionForm: false,
        hasPolicies: false,
        siblings: [],
        guardianName: '',
        guardianContact: '',
        emergencyContact: '',
      });
      
      setIsAdding(false);
      setNewTutee({
        firstName: '',
        lastName: '',
        gradeLevel: '',
        school: '',
        tutorId: '',
        modality: '',
        enrollmentDate: new Date().toISOString().split('T')[0],
        startDate: new Date().toISOString().split('T')[0],
        hours: 1,
        rate: '',
        package: '20',
        status: 'Pending',
      });
      setFieldErrors({});
      
      if (newEntry && newEntry.id) {
        setNewTuteeId(newEntry.id);
        setTimeout(() => {
          setNewTuteeId(null);
        }, 3000);
      }
      
      await fetchTutees();
    } catch (error) {
      console.error('Failed to add tutee:', error);
      alert('Failed to add tutee. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Remove tutee handlers
  const handleRemoveModeToggle = () => {
    setRemoveMode(!removeMode);
  };

  const handleRemoveClick = (tutee) => {
    setSelectedTutee(tutee);
    setShowRemoveModal(true);
  };

  const handleConfirmRemove = async () => {
    if (!selectedTutee) return;
    setIsDeleting(true);
    try {
      await deleteTutee(selectedTutee.id);
      setShowRemoveModal(false);
      setSelectedTutee(null);
      await fetchTutees();
    } catch (error) {
      console.error('Failed to delete tutee:', error);
      alert('Failed to delete tutee. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelRemove = () => {
    setShowRemoveModal(false);
    setSelectedTutee(null);
  };

  // Check if a field has error
  const hasError = (field) => {
    return fieldErrors[field] !== undefined;
  };

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

  const hoursOptions = [
    { value: 1, label: '1 hr' },
    { value: 1.5, label: '1.5 hrs' },
    { value: 2, label: '2 hrs' },
  ];

  const packageOptions = [
    { value: '20', label: '20 hrs' },
    { value: '30', label: '30 hrs' },
    { value: '40', label: '40 hrs' },
  ];

  const statusOptions = [
    { value: 'Active', label: 'Active' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Inactive', label: 'Inactive' },
  ];

  const tutorOptions = [
    { value: '', label: 'Unassigned' },
    ...tutors.map(tutor => ({ value: tutor.id, label: `${tutor.firstName} ${tutor.lastName}` }))
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Header />
      
      <div className="container mx-auto px-4 py-4 pb-32">
        {/* Header with Add and Remove Buttons */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">All Tutees</h2>
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
                  className={`flex items-center gap-1 text-xs px-3 py-2 rounded-xl transition-colors ${removeMode ? 'text-white hover:bg-red-500/30' : 'text-white/70 hover:text-white'}`}
                  style={{
                    backgroundColor: removeMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.05)',
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

        {/* Add Tutee Form Card */}
        {isAdding && (
          <div ref={formRef} className="glass-card p-4 mb-4">
            <div className="grid grid-cols-2 gap-3">
              {/* Row 1: First Name + Last Name */}
              <div className="col-span-1">
                <span className="text-[10px] text-white/40 block mb-0.5">First Name</span>
                <input
                  id="field-firstName"
                  type="text"
                  value={newTutee.firstName}
                  onChange={(e) => setNewTutee(prev => ({ ...prev, firstName: e.target.value }))}
                  onFocus={() => setFieldErrors(prev => ({ ...prev, firstName: undefined }))}
                  placeholder="First Name"
                  className={`input-dark w-full ${hasError('firstName') ? 'field-error' : ''}`}
                />
              </div>
              <div className="col-span-1">
                <span className="text-[10px] text-white/40 block mb-0.5">Last Name</span>
                <input
                  id="field-lastName"
                  type="text"
                  value={newTutee.lastName}
                  onChange={(e) => setNewTutee(prev => ({ ...prev, lastName: e.target.value }))}
                  onFocus={() => setFieldErrors(prev => ({ ...prev, lastName: undefined }))}
                  placeholder="Last Name"
                  className={`input-dark w-full ${hasError('lastName') ? 'field-error' : ''}`}
                />
              </div>
              
              {/* Row 2: Grade + School */}
              <div className="col-span-1">
                <span className="text-[10px] text-white/40 block mb-0.5">Grade</span>
                <input
                  id="field-gradeLevel"
                  type="text"
                  value={newTutee.gradeLevel}
                  onChange={(e) => setNewTutee(prev => ({ ...prev, gradeLevel: e.target.value }))}
                  onFocus={() => setFieldErrors(prev => ({ ...prev, gradeLevel: undefined }))}
                  placeholder="Grade"
                  className={`input-dark w-full ${hasError('gradeLevel') ? 'field-error' : ''}`}
                />
              </div>
              <div className="col-span-1">
                <span className="text-[10px] text-white/40 block mb-0.5">School</span>
                <input
                  id="field-school"
                  type="text"
                  value={newTutee.school}
                  onChange={(e) => setNewTutee(prev => ({ ...prev, school: e.target.value }))}
                  onFocus={() => setFieldErrors(prev => ({ ...prev, school: undefined }))}
                  placeholder="School"
                  className={`input-dark w-full ${hasError('school') ? 'field-error' : ''}`}
                />
              </div>
              
              {/* Row 3: Tutor + Modality + Enrollment + Start */}
              <div className="col-span-2 grid grid-cols-4 gap-3">
                <div>
                  <span className="text-[10px] text-white/40 block mb-0.5">Tutor</span>
                  <div id="field-tutorId" className={hasError('tutorId') ? 'field-error rounded-lg' : ''}>
                    <Select
                      value={newTutee.tutorId || ''}
                      onChange={(val) => {
                        setNewTutee(prev => ({ ...prev, tutorId: val }));
                        setFieldErrors(prev => ({ ...prev, tutorId: undefined }));
                      }}
                      options={tutorOptions}
                      placeholder="Select tutor"
                      className="w-full"
                    />
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-white/40 block mb-0.5">Modality</span>
                  <div id="field-modality" className={hasError('modality') ? 'field-error rounded-lg' : ''}>
                    <Select
                      value={newTutee.modality || ''}
                      onChange={(val) => {
                        setNewTutee(prev => ({ ...prev, modality: val }));
                        setFieldErrors(prev => ({ ...prev, modality: undefined }));
                      }}
                      options={modalityOptions}
                      placeholder="Select"
                      className="w-full"
                    />
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-white/40 block mb-0.5">Enrollment</span>
                  <div id="field-enrollmentDate" className={hasError('enrollmentDate') ? 'field-error rounded-lg' : ''}>
                    <DatePicker
                      value={newTutee.enrollmentDate}
                      onChange={(val) => {
                        setNewTutee(prev => ({ ...prev, enrollmentDate: val }));
                        setFieldErrors(prev => ({ ...prev, enrollmentDate: undefined }));
                      }}
                      placeholder="Select date"
                      className="w-full"
                    />
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-white/40 block mb-0.5">Start</span>
                  <div id="field-startDate" className={hasError('startDate') ? 'field-error rounded-lg' : ''}>
                    <DatePicker
                      value={newTutee.startDate}
                      onChange={(val) => {
                        setNewTutee(prev => ({ ...prev, startDate: val }));
                        setFieldErrors(prev => ({ ...prev, startDate: undefined }));
                      }}
                      placeholder="Select date"
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
              
              {/* Row 4: Hours + Rate + Package + Status */}
              <div className="col-span-2 grid grid-cols-4 gap-3">
                <div>
                  <span className="text-[10px] text-white/40 block mb-0.5">Hours</span>
                  <div id="field-hours" className={hasError('hours') ? 'field-error rounded-lg' : ''}>
                    <Select
                      value={newTutee.hours}
                      onChange={(val) => {
                        setNewTutee(prev => ({ ...prev, hours: val }));
                        setFieldErrors(prev => ({ ...prev, hours: undefined }));
                      }}
                      options={hoursOptions}
                      placeholder="Select"
                      className="w-full"
                    />
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-white/40 block mb-0.5">Rate</span>
                  <input
                    id="field-rate"
                    type="number"
                    value={newTutee.rate}
                    onChange={(e) => setNewTutee(prev => ({ ...prev, rate: e.target.value }))}
                    onFocus={() => setFieldErrors(prev => ({ ...prev, rate: undefined }))}
                    placeholder="0"
                    className={`input-dark w-full ${hasError('rate') ? 'field-error' : ''}`}
                  />
                </div>
                <div>
                  <span className="text-[10px] text-white/40 block mb-0.5">Package</span>
                  <div id="field-package" className={hasError('package') ? 'field-error rounded-lg' : ''}>
                    <Select
                      value={newTutee.package}
                      onChange={(val) => {
                        setNewTutee(prev => ({ ...prev, package: val }));
                        setFieldErrors(prev => ({ ...prev, package: undefined }));
                      }}
                      options={packageOptions}
                      placeholder="Select"
                      className="w-full"
                    />
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-white/40 block mb-0.5">Status</span>
                  <div id="field-status" className={hasError('status') ? 'field-error rounded-lg' : ''}>
                    <Select
                      value={newTutee.status || 'Pending'}
                      onChange={(val) => {
                        setNewTutee(prev => ({ ...prev, status: val }));
                        setFieldErrors(prev => ({ ...prev, status: undefined }));
                      }}
                      options={statusOptions}
                      placeholder="Select"
                      className="w-full"
                    />
                  </div>
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
            <table className="w-full border-collapse min-w-[1100px]">
              <thead>
                <tr className="border-0">
                  <th className="text-left py-3 px-3 text-xs font-medium text-white/40 w-12 border-0 sticky left-0 bg-[#1a1a1a] z-20">#</th>
                  {removeMode && (
                    <th className="text-left py-3 px-3 text-xs font-medium text-white/40 border-0 w-12 bg-[#1a1a1a] z-20">Action</th>
                  )}
                  
                  {/* Name - Custom Sort */}
                  <th 
                    className="text-left py-3 px-3 border-0 min-w-[140px] sticky left-[39px] bg-[#1a1a1a] z-10 cursor-pointer hover:text-white/70 transition-colors"
                    onClick={toggleNameSort}
                  >
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-medium" style={{ color: sortDirection ? '#a78bfa' : 'rgba(255, 255, 255, 0.4)' }}>
                        Name
                      </span>
                      {sortDirection === 'asc' && <ChevronUp className="w-3 h-3" style={{ color: '#a78bfa' }} />}
                      {sortDirection === 'desc' && <ChevronDown className="w-3 h-3" style={{ color: '#a78bfa' }} />}
                      {!sortDirection && <ArrowUpDown className="w-3 h-3" style={{ color: 'rgba(255, 255, 255, 0.3)' }} />}
                    </div>
                  </th>
                  
                  <th className="text-left py-3 px-3 border-0 min-w-[70px]">
                    <ColumnHeader
                      label="Grade"
                      type="filter"
                      options={getFilterOptions('gradeLevel')}
                      value={gradeFilter}
                      onChange={setGradeFilter}
                    />
                  </th>
                  <th className="text-left py-3 px-3 border-0 min-w-[120px]">
                    <ColumnHeader
                      label="School"
                      type="filter"
                      options={getFilterOptions('school')}
                      value={schoolFilter}
                      onChange={setSchoolFilter}
                    />
                  </th>
                  <th className="text-left py-3 px-3 border-0 min-w-[120px]">
                    <ColumnHeader
                      label="Tutor"
                      type="filter"
                      options={getFilterOptions('tutor')}
                      value={tutorFilter}
                      onChange={setTutorFilter}
                    />
                  </th>
                  <th className="text-left py-3 px-3 border-0 min-w-[100px]">
                    <ColumnHeader
                      label="Modality"
                      type="filter"
                      options={getFilterOptions('modality')}
                      value={modalityFilter}
                      onChange={setModalityFilter}
                    />
                  </th>
                  
                  {/* Enrollment - Custom Sort */}
                  <th 
                    className="text-left py-3 px-3 border-0 min-w-[100px] cursor-pointer hover:text-white/70 transition-colors"
                    onClick={toggleEnrollmentSort}
                  >
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-medium" style={{ color: enrollmentSort ? '#a78bfa' : 'rgba(255, 255, 255, 0.4)' }}>
                        Enrollment
                      </span>
                      {enrollmentSort === 'asc' && <ChevronUp className="w-3 h-3" style={{ color: '#a78bfa' }} />}
                      {enrollmentSort === 'desc' && <ChevronDown className="w-3 h-3" style={{ color: '#a78bfa' }} />}
                      {!enrollmentSort && <ArrowUpDown className="w-3 h-3" style={{ color: 'rgba(255, 255, 255, 0.3)' }} />}
                    </div>
                  </th>
                  
                  {/* Start - Custom Sort */}
                  <th 
                    className="text-left py-3 px-3 border-0 min-w-[100px] cursor-pointer hover:text-white/70 transition-colors"
                    onClick={toggleStartSort}
                  >
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-medium" style={{ color: startSort ? '#a78bfa' : 'rgba(255, 255, 255, 0.4)' }}>
                        Start
                      </span>
                      {startSort === 'asc' && <ChevronUp className="w-3 h-3" style={{ color: '#a78bfa' }} />}
                      {startSort === 'desc' && <ChevronDown className="w-3 h-3" style={{ color: '#a78bfa' }} />}
                      {!startSort && <ArrowUpDown className="w-3 h-3" style={{ color: 'rgba(255, 255, 255, 0.3)' }} />}
                    </div>
                  </th>
                  
                  {/* End - Custom Sort */}
                  <th 
                    className="text-left py-3 px-3 border-0 min-w-[100px] cursor-pointer hover:text-white/70 transition-colors"
                    onClick={toggleEndSort}
                  >
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-medium" style={{ color: endSort ? '#a78bfa' : 'rgba(255, 255, 255, 0.4)' }}>
                        End
                      </span>
                      {endSort === 'asc' && <ChevronUp className="w-3 h-3" style={{ color: '#a78bfa' }} />}
                      {endSort === 'desc' && <ChevronDown className="w-3 h-3" style={{ color: '#a78bfa' }} />}
                      {!endSort && <ArrowUpDown className="w-3 h-3" style={{ color: 'rgba(255, 255, 255, 0.3)' }} />}
                    </div>
                  </th>
                  
                  {/* Balance - Custom Sort */}
                  <th 
                    className="text-left py-3 px-3 border-0 min-w-[90px] cursor-pointer hover:text-white/70 transition-colors"
                    onClick={toggleBalanceSort}
                  >
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-medium" style={{ color: balanceSort ? '#a78bfa' : 'rgba(255, 255, 255, 0.4)' }}>
                        Balance
                      </span>
                      {balanceSort === 'asc' && <ChevronUp className="w-3 h-3" style={{ color: '#a78bfa' }} />}
                      {balanceSort === 'desc' && <ChevronDown className="w-3 h-3" style={{ color: '#a78bfa' }} />}
                      {!balanceSort && <ArrowUpDown className="w-3 h-3" style={{ color: 'rgba(255, 255, 255, 0.3)' }} />}
                    </div>
                  </th>
                  
                  {/* GC, AF, POL - No sort, just filters */}
                  <th className="text-left py-3 px-3 border-0 min-w-[50px] text-center">
                    <span className="text-xs font-medium text-white/40">GC</span>
                  </th>
                  <th className="text-left py-3 px-3 border-0 min-w-[50px] text-center">
                    <span className="text-xs font-medium text-white/40">AF</span>
                  </th>
                  <th className="text-left py-3 px-3 border-0 min-w-[50px] text-center">
                    <span className="text-xs font-medium text-white/40">POL</span>
                  </th>
                  <th className="text-left py-3 px-3 border-0 min-w-[100px]">
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
                    <td colSpan={removeMode ? 15 : 14} className="text-center py-12 text-white/40 text-sm border-0">
                      No tutees found
                    </td>
                  </tr>
                ) : (
                  paginatedTutees.map((tutee, index) => {
                    const isNewEntry = tutee.id === newTuteeId;
                    return (
                      <tr 
                        key={`${tutee.id}-${index}`} 
                        className={`border-0 hover:bg-white/5 transition-colors ${isNewEntry ? 'pulse-green' : ''}`}
                        onClick={() => navigate(`/tutee/${tutee.id}`)}
                        style={{
                          backgroundColor: isNewEntry ? 'rgba(34, 197, 94, 0.05)' : 'transparent',
                          borderLeft: isNewEntry ? '2px solid #4ade80' : 'none',
                          transition: 'all 0.3s ease',
                        }}
                      >
                        {/* # Column */}
                        <td className="py-3 px-3 text-sm text-white/40 border-0 sticky left-0 bg-[#1a1a1a] z-10">
                          {(currentPage - 1) * itemsPerPage + index + 1}
                        </td>
                        
                        {/* Action Column (only in remove mode) */}
                        {removeMode && (
                          <td className="py-3 px-3 border-0 text-center bg-[#1a1a1a] z-10">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveClick(tutee);
                              }}
                              className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                        
                        {/* Name */}
                        <td className="py-3 px-3 text-sm text-white/80 border-0 sticky left-[39px] bg-[#1a1a1a] z-10">
                          {getFullName(tutee)}
                        </td>
                        
                        <td className="py-3 px-3 text-sm text-white/60 border-0">{tutee.gradeLevel || '-'}</td>
                        <td className="py-3 px-3 text-sm text-white/60 border-0">{tutee.school || '-'}</td>
                        <td className="py-3 px-3 text-sm text-white/60 border-0">{getTutorName(tutee.tutorId)}</td>
                        <td className="py-3 px-3 text-sm text-white/60 border-0">
                          {tutee.modality ? (
                            <ModalityPill modality={tutee.modality} />
                          ) : (
                            <span className="text-white/30 text-xs">-</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-sm text-white/60 border-0">{formatDate(tutee.enrollmentDate)}</td>
                        <td className="py-3 px-3 text-sm text-white/60 border-0">{formatDate(tutee.startDate)}</td>
                        <td className="py-3 px-3 text-sm text-white/60 border-0">{formatDate(tutee.endDate)}</td>
                        <td className="py-3 px-3 text-sm text-white/60 border-0">
                          {tutee.balance ? `₱${tutee.balance}` : '₱0'}
                        </td>
                        
                        {/* GC - Green/Red Circle */}
                        <td className="py-3 px-3 text-sm text-white/60 border-0 text-center">
                          <span className="inline-flex items-center justify-center w-3 h-3">
                            {tutee.isInGroupChat ? (
                              <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                            ) : (
                              <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                            )}
                          </span>
                        </td>
                        
                        {/* AF - Green/Red Circle */}
                        <td className="py-3 px-3 text-sm text-white/60 border-0 text-center">
                          <span className="inline-flex items-center justify-center w-3 h-3">
                            {tutee.hasAdmissionForm ? (
                              <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                            ) : (
                              <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                            )}
                          </span>
                        </td>
                        
                        {/* POL - Green/Red Circle */}
                        <td className="py-3 px-3 text-sm text-white/60 border-0 text-center">
                          <span className="inline-flex items-center justify-center w-3 h-3">
                            {tutee.hasPolicies ? (
                              <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                            ) : (
                              <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                            )}
                          </span>
                        </td>
                        
                        {/* Status */}
                        <td className="py-3 px-3 border-0">
                          <StatusChip status={tutee.status} />
                        </td>
                      </tr>
                    );
                  })
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

        {/* Result count */}
        <div className="mt-4 text-center">
          <p className="text-xs text-white/40">
            Showing {paginatedTutees.length} of {filteredTutees.length} tutees
          </p>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showRemoveModal && selectedTutee && (
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
              <h3 className="text-lg font-semibold text-white">⚠️ Remove Tutee?</h3>
              <button
                onClick={handleCancelRemove}
                className="text-white/40 hover:text-white/80 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-sm text-white/60 mb-2">
              Are you sure you want to remove <span className="text-white/80 font-medium">{getFullName(selectedTutee)}</span>?
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

export default TuteeListPage;
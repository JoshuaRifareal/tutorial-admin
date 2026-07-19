import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Save, User, Calendar, Users, Plus, X } from 'lucide-react';
import useTutorStore from '../stores/tutorStore';
import useTuteeStore from '../stores/tuteeStore';
import Header from '../components/common/Header';
import BottomNav from '../components/common/BottomNav';
import StatusChip from '../components/lists/StatusChip';
import Select from '../components/common/Select';
import NumberInput from '../components/common/NumberInput';
import DatePicker from '../components/common/DatePicker';
import HistoryButton from '../components/common/HistoryButton';
import ModalityPill from '../components/common/ModalityPill';
import { logEvent } from '../services/auditService';
import { format, parseISO } from 'date-fns';

const TutorProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tutors, isLoading, fetchTutors, updateTutor } = useTutorStore();
  const { tutees, fetchTutees } = useTuteeStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(null);
  const [tutor, setTutor] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddSubstitution, setShowAddSubstitution] = useState(false);
  const [showAddTutee, setShowAddTutee] = useState(false);
  const [selectedTuteeToAdd, setSelectedTuteeToAdd] = useState('');
  const [dataLoaded, setDataLoaded] = useState(false);

  // Substitution state
  const [substitutions, setSubstitutions] = useState([]);
  const [newSubstitution, setNewSubstitution] = useState({
    substituteTutorId: '',
    tuteeId: '',
    date: '',
    hours: 1,
  });

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchTutors(), fetchTutees()]);
      setDataLoaded(true);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (dataLoaded && tutors.length > 0 && id) {
      const found = tutors.find(t => t.id === id);
      if (found) {
        setTutor(found);
        setFormData({ ...found });
        if (found.substitutions) {
          setSubstitutions(found.substitutions);
        } else {
          setSubstitutions([]);
        }
      }
    }
  }, [dataLoaded, tutors, id]);

  // Get tutee name by ID
  const getTuteeName = (tuteeId) => {
    if (!tuteeId) return 'Unknown';
    const tutee = tutees.find(t => t.id === tuteeId);
    return tutee ? `${tutee.firstName} ${tutee.lastName}` : 'Unknown';
  };

  // Get tutor name by ID
  const getTutorName = (tutorId) => {
    if (!tutorId) return 'Unknown';
    const tutor = tutors.find(t => t.id === tutorId);
    return tutor ? `${tutor.firstName} ${tutor.lastName}` : 'Unknown';
  };

  // Get assigned tutees with details
  const getAssignedTutees = () => {
    if (!dataLoaded) return [];
    if (!tutor || !tutor.tutees || !Array.isArray(tutor.tutees)) return [];
    return tutor.tutees
      .map(id => tutees.find(t => t.id === id))
      .filter(Boolean);
  };

  // Get unassigned tutees (for adding)
  const getUnassignedTutees = () => {
    const assignedIds = tutor?.tutees || [];
    return tutees.filter(t => !assignedIds.includes(t.id) && !t.isDeleted);
  };

  // Get unique modalities from assigned tutees
  const getTutorModalities = () => {
    if (!assignedTutees || assignedTutees.length === 0) return [];
    const modalities = new Set();
    assignedTutees.forEach(tutee => {
      if (tutee.modality) {
        modalities.add(tutee.modality);
      }
    });
    return Array.from(modalities);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setFormData({ ...tutor });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({ ...tutor });
    setShowAddTutee(false);
    setShowAddSubstitution(false);
  };

  const handleSave = async () => {
    if (!formData) return;
    setIsSaving(true);
    try {
      const updatedData = {
        ...formData,
        substitutions: substitutions,
      };
      await updateTutor(id, updatedData);
      setIsEditing(false);
      setTutor({ ...formData, substitutions: substitutions });
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Tutee management
  const handleAddTutee = () => {
    if (!selectedTuteeToAdd) return;
    
    const currentTutees = formData?.tutees || [];
    if (!currentTutees.includes(selectedTuteeToAdd)) {
      setFormData(prev => ({
        ...prev,
        tutees: [...currentTutees, selectedTuteeToAdd]
      }));
    }
    setSelectedTuteeToAdd('');
    setShowAddTutee(false);
  };

  const handleRemoveTutee = (tuteeId) => {
    if (window.confirm('Remove this tutee from the tutor\'s assignments?')) {
      setFormData(prev => ({
        ...prev,
        tutees: prev.tutees.filter(id => id !== tuteeId)
      }));
    }
  };

  // Substitution handlers
  const handleAddSubstitution = () => {
    if (!newSubstitution.substituteTutorId || !newSubstitution.tuteeId || !newSubstitution.date) {
      alert('Please fill in all fields');
      return;
    }

    const entry = {
      id: `sub_${Date.now()}`,
      tutorId: id,
      substituteTutorId: newSubstitution.substituteTutorId,
      tuteeId: newSubstitution.tuteeId,
      date: newSubstitution.date,
      hours: newSubstitution.hours || 1,
      createdAt: new Date().toISOString(),
    };

    setSubstitutions([entry, ...substitutions]);
    setNewSubstitution({
      substituteTutorId: '',
      tuteeId: '',
      date: '',
      hours: 1,
    });
    setShowAddSubstitution(false);
  };

  const handleRemoveSubstitution = (index) => {
    if (window.confirm('Remove this substitution record?')) {
      setSubstitutions(substitutions.filter((_, i) => i !== index));
    }
  };

  const handleRevert = async (entry) => {
    if (!entry || !entry.changes) return;
    
    setIsSaving(true);
    try {
      const revertedData = { ...tutor };
      const changes = entry.changes || {};
      
      Object.keys(changes).forEach(field => {
        revertedData[field] = changes[field].new;
      });
      
      await updateTutor(id, revertedData);
      
      const userEmail = localStorage.getItem('google_oauth_user') 
        ? JSON.parse(localStorage.getItem('google_oauth_user')).email 
        : 'system';
      
      await logEvent({
        entityType: 'tutor',
        entityId: id,
        action: 'revert',
        changes: {
          revertedTo: entry.id,
          revertedFrom: new Date().toISOString(),
          fields: Object.keys(changes)
        },
        userEmail: userEmail,
      });
      
      setIsEditing(false);
      setTutor(revertedData);
      alert('Successfully reverted changes!');
    } catch (error) {
      console.error('Failed to revert:', error);
      alert('Failed to revert changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const assignedTutees = getAssignedTutees();
  const unassignedTutees = getUnassignedTutees();
  const currentData = isEditing ? formData : tutor;

  if (isLoading || !dataLoaded || !tutor) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <Header />
        <div className="container max-w-2xl mx-auto px-4 py-4 pb-32">
          <div className="animate-pulse space-y-4">
            <div className="glass-card p-6">
              <div className="h-8 bg-white/10 rounded w-1/4"></div>
            </div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="glass-card p-6">
                <div className="h-6 bg-white/10 rounded w-1/3 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-white/10 rounded w-full"></div>
                  <div className="h-4 bg-white/10 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  // Filter options
  const tutorOptions = tutors
    .filter(t => t.id !== id)
    .map(t => ({ value: t.id, label: `${t.firstName} ${t.lastName}` }));

  const tuteeOptions = tutees
    .filter(t => !t.isDeleted)
    .map(t => ({ value: t.id, label: `${t.firstName} ${t.lastName}` }));

  const unassignedTuteeOptions = unassignedTutees
    .map(t => ({ value: t.id, label: `${t.firstName} ${t.lastName}` }));

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Header />
      
      <div className="container max-w-2xl mx-auto px-4 py-4 pb-32">
        {/* Back Button & Actions */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate('/tutors')}
            className="flex items-center gap-2 text-white/60 hover:text-white/90 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Tutors</span>
          </button>
          <div className="flex items-center gap-2">
            <HistoryButton 
              entityType="tutor"
              entityId={id}
              onRevert={handleRevert}
              isAdmin={true}
            />
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="px-3 py-1.5 rounded-lg text-sm text-white/60 hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </>
            ) : (
              <button
                onClick={handleEdit}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-white/5 text-white/60 hover:bg-white/10 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
            )}
          </div>
        </div>

        {/* Profile Header */}
        <div className="glass-card p-6 mb-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
              {currentData.firstName?.[0]}{currentData.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={currentData.firstName || ''}
                      onChange={(e) => handleChange('firstName', e.target.value)}
                      placeholder="First Name"
                      className="input-dark"
                    />
                    <input
                      type="text"
                      value={currentData.lastName || ''}
                      onChange={(e) => handleChange('lastName', e.target.value)}
                      placeholder="Last Name"
                      className="input-dark"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <input
                      type="text"
                      value={currentData.school || ''}
                      onChange={(e) => handleChange('school', e.target.value)}
                      placeholder="School"
                      className="input-dark"
                      style={{ flex: 1, minWidth: '120px' }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <input
                      type="text"
                      value={currentData.program || ''}
                      onChange={(e) => handleChange('program', e.target.value)}
                      placeholder="Program"
                      className="input-dark"
                      style={{ flex: 1 }}
                    />
                    <input
                      type="text"
                      value={currentData.major || ''}
                      onChange={(e) => handleChange('major', e.target.value)}
                      placeholder="Major"
                      className="input-dark"
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-xl font-bold text-white">
                    {currentData.firstName} {currentData.lastName}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <div className="flex flex-wrap gap-1">
                      {getTutorModalities().map((mod, idx) => (
                        <ModalityPill key={idx} modality={mod} />
                      ))}
                    </div>
                    <span className="text-sm text-white/40">|</span>
                    <span className="text-sm text-white/60">{currentData.school || '-'}</span>
                    <span className="text-sm text-white/40">|</span>
                    <span className="text-sm text-white/60">{currentData.program || '-'}</span>
                    <span className="text-sm text-white/40">|</span>
                    <span className="text-sm text-white/60">{currentData.major || '-'}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Schedule */}
        {dataLoaded && assignedTutees.length > 0 && (
          <div className="glass-card p-5 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-white/40" />
              <h3 className="text-sm font-medium text-white/80">Schedule</h3>
            </div>
            
            <div className="overflow-hidden rounded-xl" style={{ border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <th 
                        key={day} 
                        className="text-center py-2 px-2 text-[10px] font-medium text-white/40"
                        style={{ borderRight: '1px solid rgba(255, 255, 255, 0.06)' }}
                      >
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => {
                      // Get all schedules for this day from assigned active tutees
                      const schedulesForDay = assignedTutees
                      .filter(t => t.status && t.status.toLowerCase() === 'active')  // Case-insensitive check
                      .map(t => {
                        const schedule = t.schedule || {};
                        return {
                          tutee: t,
                          time: schedule[day] || ''
                        };
                      })
                      .filter(s => s.time && s.time !== 'TBA' && s.time !== '')
                      .sort((a, b) => {
                        const timeA = new Date(`1970-01-01 ${a.time}`);
                        const timeB = new Date(`1970-01-01 ${b.time}`);
                        return timeA - timeB;
                      });
                      
                      return (
                        <td 
                          key={day} 
                          className="text-center py-2 px-2 text-xs align-middle"
                          style={{ 
                            borderRight: index < 5 ? '1px solid rgba(255, 255, 255, 0.06)' : 'none',
                          }}
                        >
                          {schedulesForDay.length > 0 ? (
                            <div className="space-y-0.5">
                              {schedulesForDay.map((s, idx) => (
                                <div 
                                  key={idx} 
                                  className="text-white/70 font-medium text-xs"
                                  style={{ fontSize: '11px' }}
                                >
                                  {s.time}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>TBA</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
            
            {(() => {
              const tuteesWithSchedule = assignedTutees
                .filter(t => t.status && t.status.toLowerCase() === 'active')
                .filter(t => {
                  const schedule = t.schedule || {};
                  return Object.values(schedule).some(time => time && time !== 'TBA' && time !== '');
              });
              
              if (tuteesWithSchedule.length === 0) return null;
            })()}
          </div>
        )}

        {/* Card 3: Assigned Tutees */}
        <div className="glass-card p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-white/40" />
              <h3 className="text-sm font-medium text-white/80">
                Assigned Tutees ({assignedTutees.length})
              </h3>
            </div>
            {isEditing && (
              <button
                onClick={() => setShowAddTutee(!showAddTutee)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-white/70 hover:text-white transition-colors"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                }}
              >
                <Plus className="w-3 h-3" />
                Add Tutee
              </button>
            )}
          </div>

          {/* Add Tutee Form */}
          {showAddTutee && isEditing && (
            <div className="bg-white/5 rounded-lg p-3 mb-3">
              <div className="flex items-center gap-2">
                <Select
                  value={selectedTuteeToAdd}
                  onChange={(val) => setSelectedTuteeToAdd(val)}
                  options={[
                    { value: '', label: 'Select tutee' },
                    ...unassignedTuteeOptions
                  ]}
                  placeholder="Select tutee"
                  className="flex-1"
                />
                <button
                  onClick={handleAddTutee}
                  disabled={!selectedTuteeToAdd}
                  className="px-3 py-1.5 rounded-lg text-xs bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowAddTutee(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-white/40 hover:bg-white/5 hover:text-white/60 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {assignedTutees.length > 0 ? (
            <div className="overflow-hidden rounded-xl" style={{ border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <th className="text-left py-2 px-3 text-[10px] font-medium text-white/40 w-10">#</th>
                    <th className="text-left py-2 px-3 text-[10px] font-medium text-white/40">Name</th>
                    <th className="text-left py-2 px-3 text-[10px] font-medium text-white/40">Grade</th>
                    <th className="text-left py-2 px-3 text-[10px] font-medium text-white/40">School</th>
                    <th className="text-left py-2 px-3 text-[10px] font-medium text-white/40">Status</th>
                    {isEditing && (
                      <th className="text-left py-2 px-3 text-[10px] font-medium text-white/40">Action</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {assignedTutees.map((tutee, index) => (
                    <tr 
                      key={tutee.id}
                      className="cursor-pointer hover:bg-white/5 transition-colors"
                      style={{ borderTop: index > 0 ? '1px solid rgba(255, 255, 255, 0.06)' : 'none' }}
                      onClick={() => navigate(`/tutee/${tutee.id}`)}
                    >
                      <td className="py-2 px-3 text-xs text-white/40">{index + 1}</td>
                      <td className="py-2 px-3 text-xs text-white/80">
                        {tutee.firstName} {tutee.lastName}
                      </td>
                      <td className="py-2 px-3 text-xs text-white/60">{tutee.gradeLevel || '-'}</td>
                      <td className="py-2 px-3 text-xs text-white/60">{tutee.school || '-'}</td>
                      <td className="py-2 px-3">
                        <StatusChip status={tutee.status} />
                      </td>
                      {isEditing && (
                        <td className="py-2 px-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveTutee(tutee.id);
                            }}
                            className="text-white/30 hover:text-red-400 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-white/40 text-center py-4">No assigned tutees</p>
          )}
        </div>

        {/* Card 4: Substitution History */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-white/40" />
              <h3 className="text-sm font-medium text-white/80">Substitution History</h3>
            </div>
            {isEditing && (
              <button
                onClick={() => setShowAddSubstitution(!showAddSubstitution)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-white/70 hover:text-white transition-colors"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                }}
              >
                <Plus className="w-3 h-3" />
                Add Substitution
              </button>
            )}
          </div>

          {/* Add Substitution Form */}
          {showAddSubstitution && isEditing && (
            <div className="bg-white/5 rounded-lg p-3 mb-3 w-full">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full">
                <div className="w-full min-w-0">
                  <span className="text-[10px] text-white/40 block mb-0.5">Date</span>
                  <div className="w-full">
                    <DatePicker
                      value={newSubstitution.date}
                      onChange={(val) => setNewSubstitution(prev => ({ ...prev, date: val }))}
                      placeholder="Select date"
                      className="w-full"
                    />
                  </div>
                </div>
                <div className="w-full min-w-0">
                  <span className="text-[10px] text-white/40 block mb-0.5">Substitute</span>
                  <div className="w-full">
                    <Select
                      value={newSubstitution.substituteTutorId}
                      onChange={(val) => setNewSubstitution(prev => ({ ...prev, substituteTutorId: val }))}
                      options={[
                        { value: '', label: 'Select' },
                        ...tutorOptions
                      ]}
                      placeholder="Select"
                      className="w-full"
                    />
                  </div>
                </div>
                <div className="w-full min-w-0">
                  <span className="text-[10px] text-white/40 block mb-0.5">Tutee</span>
                  <div className="w-full">
                    <Select
                      value={newSubstitution.tuteeId}
                      onChange={(val) => setNewSubstitution(prev => ({ ...prev, tuteeId: val }))}
                      options={[
                        { value: '', label: 'Select' },
                        ...tuteeOptions
                      ]}
                      placeholder="Select"
                      className="w-full"
                    />
                  </div>
                </div>
                <div className="w-full min-w-0">
                  <span className="text-[10px] text-white/40 block mb-0.5">Hours</span>
                  <div className="w-full">
                    <NumberInput
                      value={newSubstitution.hours}
                      onChange={(val) => setNewSubstitution(prev => ({ ...prev, hours: parseFloat(val) || 1 }))}
                      placeholder="Hours"
                      min={0.5}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-2 w-full">
                <button
                  onClick={handleAddSubstitution}
                  disabled={!newSubstitution.substituteTutorId || !newSubstitution.tuteeId || !newSubstitution.date}
                  className="flex-1 py-1.5 rounded-lg text-xs bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowAddSubstitution(false)}
                  className="flex-1 py-1.5 rounded-lg text-xs text-white/40 hover:text-white/60 transition-colors"
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Substitution Table */}
          {substitutions.length > 0 ? (
            <div className="overflow-hidden rounded-xl" style={{ border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <th className="text-left py-2 px-3 text-[10px] font-medium text-white/40">Date</th>
                    <th className="text-left py-2 px-3 text-[10px] font-medium text-white/40">Substituted</th>
                    <th className="text-left py-2 px-3 text-[10px] font-medium text-white/40">Tutee</th>
                    <th className="text-left py-2 px-3 text-[10px] font-medium text-white/40">Hours</th>
                    {isEditing && (
                      <th className="text-left py-2 px-3 text-[10px] font-medium text-white/40">Action</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {substitutions.map((sub, index) => (
                    <tr 
                      key={sub.id || index}
                      style={{ borderTop: index > 0 ? '1px solid rgba(255, 255, 255, 0.06)' : 'none' }}
                    >
                      <td className="py-2 px-3 text-xs text-white/60">
                        {sub.date ? format(parseISO(sub.date), 'MMM d, yyyy') : '-'}
                      </td>
                      <td className="py-2 px-3 text-xs text-white/80">
                        {getTutorName(sub.substituteTutorId)}
                      </td>
                      <td className="py-2 px-3 text-xs text-white/60">
                        {getTuteeName(sub.tuteeId)}
                      </td>
                      <td className="py-2 px-3 text-xs text-white/60">
                        {sub.hours || 1} hr
                      </td>
                      {isEditing && (
                        <td className="py-2 px-3">
                          <button
                            onClick={() => handleRemoveSubstitution(index)}
                            className="text-white/30 hover:text-red-400 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-white/40 text-center py-4">No substitution records</p>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default TutorProfilePage;
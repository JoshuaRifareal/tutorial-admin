import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Save, Calendar, DollarSign, Phone, Receipt, Users, Plus, X, Package } from 'lucide-react';
import useTuteeStore from '../stores/tuteeStore';
import useTutorStore from '../stores/tutorStore';
import Header from '../components/common/Header';
import BottomNav from '../components/common/BottomNav';
import StatusChip from '../components/lists/StatusChip';
import Select from '../components/common/Select';
import NumberInput from '../components/common/NumberInput';
import DatePicker from '../components/common/DatePicker';
import HistoryButton from '../components/common/HistoryButton';
import { logEvent } from '../services/auditService';
import { format, parseISO } from 'date-fns';
import ModalityPill from '../components/common/ModalityPill';
import TimePicker from '../components/common/TimePicker';

// Onboarding Pill component
const OnboardingPill = ({ label, value, onClick, editable = false }) => {
  const isActive = value;
  
  return (
    <button
      onClick={editable ? onClick : undefined}
      disabled={!editable}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
        isActive 
          ? 'bg-green-500/20 text-green-400 border-green-500/30' 
          : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      } ${editable ? 'cursor-pointer hover:scale-105' : 'cursor-default'}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-400' : 'bg-gray-400'}`} />
      {label}
    </button>
  );
};

// Field component for view mode - with rounded border and light gray bg
const Field = ({ label, value, className = '' }) => (
  <div className={className}>
    <span className="text-[10px] text-white/40 block mb-0.5">{label}</span>
    <div 
      className="rounded-lg px-3 py-2 text-sm text-white/80 w-full truncate"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.02)',
      }}
    >
      {value || '-'}
    </div>
  </div>
);

const TuteeProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tutees, isLoading, fetchTutees, updateTutee } = useTuteeStore();
  const { tutors, fetchTutors } = useTutorStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(null);
  const [tutee, setTutee] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newPaymentIndices, setNewPaymentIndices] = useState([]);
  const [invalidPaymentIndices, setInvalidPaymentIndices] = useState([]);
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
      await Promise.all([fetchTutees(), fetchTutors()]);
      setDataLoaded(true);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (dataLoaded && tutees.length > 0 && id) {
      const found = tutees.find(t => t.id === id);
      if (found) {
        setTutee(found);
        setFormData({ ...found });
      }
    }
  }, [dataLoaded, tutees, id]);

  const getTutorName = (tutorId) => {
    const tutor = tutors.find(t => t.id === tutorId);
    return tutor ? `${tutor.firstName} ${tutor.lastName}` : 'Unassigned';
  };

  const getSiblingNames = (siblingIds) => {
    if (!siblingIds || siblingIds.length === 0) return [];
    return siblingIds
      .map(id => {
        const sibling = tutees.find(t => t.id === id);
        return sibling ? `${sibling.firstName} ${sibling.lastName}` : null;
      })
      .filter(Boolean);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setFormData({ ...tutee });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({ ...tutee });
  };

  const handleSave = async () => {
    if (!formData) return;
    
    // Validate payment rows
    const invalidIndices = [];
    const paymentRecords = formData.paymentRecord || [];
    
    paymentRecords.forEach((payment, index) => {
      if (!payment.amount || payment.amount === '' || !payment.date) {
        invalidIndices.push(index);
      }
    });
    
    if (invalidIndices.length > 0) {
      setInvalidPaymentIndices(invalidIndices);
      setTimeout(() => {
        const element = document.getElementById(`payment-row-${invalidIndices[0]}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      setTimeout(() => {
        setInvalidPaymentIndices([]);
      }, 5000);
      return;
    }
    
    setInvalidPaymentIndices([]);
    setIsSaving(true);
    try {
      await updateTutee(id, formData);
      setIsEditing(false);
      setTutee({ ...formData });
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleScheduleChange = (day, value) => {
    setFormData(prev => {
      const currentSchedule = prev.schedule || {};
      const newSchedule = {
        ...currentSchedule,
        [day]: value || ''
      };
      
      return {
        ...prev,
        schedule: newSchedule
      };
    });
  };

  const handleRevert = async (entry) => {
    if (!entry || !entry.changes) return;
    
    setIsSaving(true);
    try {
      const revertedData = { ...tutee };
      const changes = entry.changes || {};
      
      Object.keys(changes).forEach(field => {
        revertedData[field] = changes[field].new;
      });
      
      await updateTutee(id, revertedData);
      
      const userEmail = localStorage.getItem('google_oauth_user') 
        ? JSON.parse(localStorage.getItem('google_oauth_user')).email 
        : 'system';
      
      await logEvent({
        entityType: 'tutee',
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
      setTutee(revertedData);
      alert('Successfully reverted changes!');
    } catch (error) {
      console.error('Failed to revert:', error);
      alert('Failed to revert changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Payment handlers
  const handleAddPayment = () => {
    const newPayment = {
      amount: '',
      type: 'full',
      date: new Date().toISOString().split('T')[0],
      method: 'cash'
    };
    
    setFormData(prev => ({
      ...prev,
      paymentRecord: [...(prev.paymentRecord || []), newPayment]
    }));
    
    const newIndex = (formData?.paymentRecord?.length || 0);
    setNewPaymentIndices(prev => [...prev, newIndex]);
    
    setTimeout(() => {
      setNewPaymentIndices(prev => prev.filter(i => i !== newIndex));
    }, 3000);
  };

  const handleRemovePayment = (index) => {
    setFormData(prev => ({
      ...prev,
      paymentRecord: prev.paymentRecord.filter((_, i) => i !== index)
    }));
  };

  const handlePaymentChange = (index, field, value) => {
    setFormData(prev => {
      const records = [...(prev.paymentRecord || [])];
      records[index] = { ...records[index], [field]: value };
      return { ...prev, paymentRecord: records };
    });
  };

  if (isLoading || !dataLoaded || !tutee) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <Header />
        <div className="container max-w-2xl mx-auto px-4 py-4 pb-32">
          <div className="animate-pulse space-y-4">
            <div className="glass-card p-6">
              <div className="h-8 bg-white/10 rounded w-1/4"></div>
            </div>
            {[...Array(4)].map((_, i) => (
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

  const siblingNames = getSiblingNames(tutee.siblings || []);
  const currentData = isEditing ? formData : tutee;

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'pending', label: 'Pending' },
    { value: 'inactive', label: 'Inactive' },
  ];

  const packageOptions = [
    { value: '20', label: '20 hrs' },
    { value: '30', label: '30 hrs' },
    { value: '40', label: '40 hrs' },
  ];

  const hoursOptions = [
    { value: 1, label: '1 hr' },
    { value: 1.5, label: '1.5 hrs' },
    { value: 2, label: '2 hrs' },
  ];

  const paymentTypeOptions = [
    { value: 'full', label: 'Full' },
    { value: 'installment', label: 'Installment' },
  ];

  const paymentMethodOptions = [
    { value: 'cash', label: 'Cash' },
    { value: 'online', label: 'Online' },
  ];

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return format(parseISO(dateString), 'MMM d, yyyy');
    } catch {
      return '-';
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Header />
      
      <div className="container max-w-2xl mx-auto px-4 py-4 pb-32">
        {/* Back Button & Actions */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate('/tutees')}
            className="flex items-center gap-2 text-white/60 hover:text-white/90 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Tutees</span>
          </button>
          <div className="flex items-center gap-2">
            <HistoryButton 
              entityType="tutee"
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
            <div className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
              {currentData.firstName?.[0]}{currentData.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="space-y-3">
                  {/* Row 1: First Name + Last Name */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] text-white/40 block mb-0.5">First Name</span>
                      <input
                        type="text"
                        value={currentData.firstName || ''}
                        onChange={(e) => handleChange('firstName', e.target.value)}
                        placeholder="First Name"
                        className="input-dark w-full"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-white/40 block mb-0.5">Last Name</span>
                      <input
                        type="text"
                        value={currentData.lastName || ''}
                        onChange={(e) => handleChange('lastName', e.target.value)}
                        placeholder="Last Name"
                        className="input-dark w-full"
                      />
                    </div>
                  </div>
                  
                  {/* Row 2: Status + Grade */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] text-white/40 block mb-0.5">Status</span>
                      <Select
                        value={currentData.status || 'pending'}
                        onChange={(val) => handleChange('status', val)}
                        options={statusOptions}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-white/40 block mb-0.5">Grade</span>
                      <input
                        type="text"
                        value={currentData.gradeLevel || ''}
                        onChange={(e) => handleChange('gradeLevel', e.target.value)}
                        placeholder="Grade"
                        className="input-dark w-full"
                      />
                    </div>
                  </div>
                  
                  {/* Row 3: School */}
                  <div>
                    <span className="text-[10px] text-white/40 block mb-0.5">School</span>
                    <input
                      type="text"
                      value={currentData.school || ''}
                      onChange={(e) => handleChange('school', e.target.value)}
                      placeholder="School"
                      className="input-dark w-full"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-xl font-bold text-white">
                    {currentData.firstName} {currentData.lastName}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <StatusChip status={currentData.status} />
                    <span className="text-sm text-white/40">|</span>
                    <span className="text-sm text-white/60">Grade {currentData.gradeLevel || '-'}</span>
                    <span className="text-sm text-white/40">|</span>
                    <span className="text-sm text-white/60 truncate">{currentData.school || '-'}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Card 1: Schedule & Tutor */}
        <div className="glass-card p-5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-white/40" />
            <h3 className="text-sm font-medium text-white/80">Schedule & Tutor</h3>
          </div>
          
          {/* Tutor + Modality Row */}
          {isEditing ? (
            <div className="grid grid-cols-4 gap-3 mb-3">
              <div className="col-span-3">
                <span className="text-[10px] text-white/40 block mb-0.5">Tutor</span>
                <Select
                  value={currentData.tutorId || ''}
                  onChange={(val) => handleChange('tutorId', val)}
                  options={[
                    { value: '', label: 'Unassigned' },
                    ...tutors.map(t => ({ value: t.id, label: `${t.firstName} ${t.lastName}` }))
                  ]}
                  placeholder="Select tutor"
                  className="w-full"
                />
              </div>
              <div className="col-span-1">
                <span className="text-[10px] text-white/40 block mb-0.5">Modality</span>
                <Select
                  value={currentData.modality || ''}
                  onChange={(val) => handleChange('modality', val)}
                  options={[
                    { value: '', label: 'Select' },
                    { value: 'F2F', label: 'F2F' },
                    { value: 'ON', label: 'ON' },
                    { value: 'HB', label: 'HB' },
                  ]}
                  placeholder="Select"
                  className="w-full"
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm text-white/60">Tutor:</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-white/80 font-medium">{getTutorName(currentData.tutorId)}</span>
                {currentData.modality && <ModalityPill modality={currentData.modality} />}
              </div>
            </div>
          )}
          
          {/* Schedule Table */}
          <div className="overflow-hidden rounded-xl" style={{ border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[420px]">
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
                      const schedule = currentData.schedule || {};
                      const dayValue = schedule[day] || 'TBA';
                      
                      // Check if value is an object with start/end
                      const isRange = typeof dayValue === 'object' && dayValue !== null && dayValue.start;
                      const displayTime = isRange 
                        ? `${dayValue.start} → ${dayValue.end || '...'}`
                        : dayValue;
                      const isTBA = displayTime === 'TBA';
                      
                      return (
                        <td 
                          key={day} 
                          className="text-center py-2 px-2 text-xs align-middle"
                          style={{ 
                            borderRight: index < 5 ? '1px solid rgba(255, 255, 255, 0.06)' : 'none',
                          }}
                        >
                          {isEditing ? (
                            <TimePicker
                              value={dayValue}
                              onChange={(val) => handleScheduleChange(day, val)}
                              placeholder="TBA"
                              className="w-full"
                            />
                          ) : (
                            <div className="flex flex-col items-center leading-tight">
                              {isRange ? (
                                <>
                                  <span style={{ 
                                    color: 'rgba(255,255,255,0.9)',
                                    fontWeight: '600',
                                    fontSize: '12px',
                                    lineHeight: '1.3',
                                  }}>
                                    {dayValue.start}
                                  </span>
                                  <span style={{ 
                                    color: 'rgba(255,255,255,0.3)',
                                    fontSize: '8px',
                                    lineHeight: '1.2',
                                  }}>
                                    →
                                  </span>
                                  <span style={{ 
                                    color: 'rgba(255,255,255,0.9)',
                                    fontWeight: '600',
                                    fontSize: '12px',
                                    lineHeight: '1.3',
                                  }}>
                                    {dayValue.end}
                                  </span>
                                </>
                              ) : (
                                <span style={{ 
                                  color: isTBA ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.85)',
                                  fontWeight: isTBA ? '400' : '600',
                                  fontSize: '12px',
                                }}>
                                  {displayTime}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Card 2: Enrollment Information - Grid Layout */}
        <div className="glass-card p-5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-4 h-4 text-white/40" />
            <h3 className="text-sm font-medium text-white/80">Enrollment Information</h3>
          </div>
          
          {isEditing ? (
            // Edit Mode - Grid with inputs
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div>
                <span className="text-[10px] text-white/40 block mb-0.5">Enrollment</span>
                <DatePicker
                  value={currentData.enrollmentDate || ''}
                  onChange={(val) => handleChange('enrollmentDate', val)}
                  placeholder="Select date"
                  className="w-full"
                />
              </div>
              <div>
                <span className="text-[10px] text-white/40 block mb-0.5">Start</span>
                <DatePicker
                  value={currentData.startDate || ''}
                  onChange={(val) => handleChange('startDate', val)}
                  placeholder="Select date"
                  className="w-full"
                />
              </div>
              <div>
                <span className="text-[10px] text-white/40 block mb-0.5">End</span>
                <DatePicker
                  value={currentData.endDate || ''}
                  onChange={(val) => handleChange('endDate', val)}
                  placeholder="Select date"
                  className="w-full"
                />
              </div>
              <div>
                <span className="text-[10px] text-white/40 block mb-0.5">Renewal</span>
                <DatePicker
                  value={currentData.renewalDate || ''}
                  onChange={(val) => handleChange('renewalDate', val)}
                  placeholder="Select date"
                  className="w-full"
                />
              </div>
              <div>
                <span className="text-[10px] text-white/40 block mb-0.5">Rate</span>
                <NumberInput
                  value={currentData.rate || ''}
                  onChange={(val) => handleChange('rate', parseFloat(val) || 0)}
                  placeholder="0"
                  min={0}
                  className="w-full"
                />
              </div>
              <div>
                <span className="text-[10px] text-white/40 block mb-0.5">Package</span>
                <Select
                  value={currentData.package || ''}
                  onChange={(val) => handleChange('package', val)}
                  options={packageOptions}
                  placeholder="Select"
                  className="w-full"
                />
              </div>
              <div>
                <span className="text-[10px] text-white/40 block mb-0.5">Hrs/Session</span>
                <Select
                  value={currentData.hoursPerSession || 1}
                  onChange={(val) => handleChange('hoursPerSession', parseFloat(val))}
                  options={hoursOptions}
                  className="w-full"
                />
              </div>
              <div>
                <span className="text-[10px] text-white/40 block mb-0.5">Balance</span>
                <NumberInput
                  value={currentData.balance || ''}
                  onChange={(val) => handleChange('balance', parseFloat(val) || 0)}
                  placeholder="0"
                  min={0}
                  className="w-full"
                />
              </div>
            </div>
          ) : (
            // View Mode - Grid with fields
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Field label="Enrollment" value={formatDate(currentData.enrollmentDate)} />
              <Field label="Start" value={formatDate(currentData.startDate)} />
              <Field label="End" value={formatDate(currentData.endDate)} />
              <Field label="Renewal" value={formatDate(currentData.renewalDate)} />
              <Field label="Rate" value={currentData.rate ? `₱${currentData.rate}` : '-'} />
              <Field label="Package" value={currentData.package ? `${currentData.package} hrs` : '-'} />
              <Field label="Hrs/Session" value={currentData.hoursPerSession ? `${currentData.hoursPerSession} hr` : '-'} />
              <Field label="Balance" value={currentData.balance ? `₱${currentData.balance}` : '₱0'} />
            </div>
          )}
        </div>

        {/* Card 3: Onboarding Kit */}
        <div className="glass-card p-5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-4 h-4 text-white/40" />
            <h3 className="text-sm font-medium text-white/80">Onboarding Kit</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <OnboardingPill
              label="Group Chat"
              value={currentData.isInGroupChat || false}
              onClick={() => handleChange('isInGroupChat', !currentData.isInGroupChat)}
              editable={isEditing}
            />
            <OnboardingPill
              label="Admission Form"
              value={currentData.hasAdmissionForm || false}
              onClick={() => handleChange('hasAdmissionForm', !currentData.hasAdmissionForm)}
              editable={isEditing}
            />
            <OnboardingPill
              label="Policies Received"
              value={currentData.hasPolicies || false}
              onClick={() => handleChange('hasPolicies', !currentData.hasPolicies)}
              editable={isEditing}
            />
          </div>
        </div>

        {/* Card 4: Contact Information - Grid Layout */}
        <div className="glass-card p-5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Phone className="w-4 h-4 text-white/40" />
            <h3 className="text-sm font-medium text-white/80">Contact Information</h3>
          </div>
          
          {isEditing ? (
            // Edit Mode - Grid with inputs
            <div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                <div>
                  <span className="text-[10px] text-white/40 block mb-0.5">Guardian Name</span>
                  <input
                    type="text"
                    value={currentData.guardianName || ''}
                    onChange={(e) => handleChange('guardianName', e.target.value)}
                    placeholder="Guardian Name"
                    className="input-dark w-full"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-white/40 block mb-0.5">Contact Number</span>
                  <input
                    type="text"
                    value={currentData.guardianContact || ''}
                    onChange={(e) => handleChange('guardianContact', e.target.value)}
                    placeholder="Contact Number"
                    className="input-dark w-full"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-white/40 block mb-0.5">Emergency Contact</span>
                  <input
                    type="text"
                    value={currentData.emergencyContact || ''}
                    onChange={(e) => handleChange('emergencyContact', e.target.value)}
                    placeholder="Emergency Contact"
                    className="input-dark w-full"
                  />
                </div>
              </div>
              {siblingNames.length > 0 && (
                <div className="pt-2" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <span className="text-[10px] text-white/40 block mb-1">Siblings</span>
                  <div className="flex flex-wrap gap-1.5">
                    {siblingNames.map((name, idx) => (
                      <span 
                        key={idx} 
                        className="text-xs px-3 py-1 rounded-full text-white/70"
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.06)',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                        }}
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // View Mode - Grid with fields
            <div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Field label="Guardian Name" value={currentData.guardianName || '-'} />
                <Field label="Contact Number" value={currentData.guardianContact || '-'} />
                <Field label="Emergency Contact" value={currentData.emergencyContact || '-'} />
              </div>
              {siblingNames.length > 0 && (
                <div className="mt-2 pt-2" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <span className="text-[10px] text-white/40 block mb-1">Siblings</span>
                  <div className="flex flex-wrap gap-1.5">
                    {siblingNames.map((name, idx) => (
                      <span 
                        key={idx} 
                        className="text-xs px-3 py-1 rounded-full text-white/70"
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.06)',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                        }}
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Card 5: Payment History */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-white/40" />
              <h3 className="text-sm font-medium text-white/80">Payment History</h3>
            </div>
            {isEditing && (
              <button 
                onClick={handleAddPayment}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-white/70 hover:text-white transition-colors"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                }}
              >
                <Plus className="w-3 h-3" />
                Add Payment
              </button>
            )}
          </div>
          
          {(currentData.paymentRecord && currentData.paymentRecord.length > 0) ? (
            <div className="overflow-x-auto">
              <div className="overflow-hidden rounded-xl min-w-[500px]" style={{ border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <table className="w-full border-collapse">
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                      <th className="text-left py-2 px-3 text-[10px] font-medium text-white/40">Date</th>
                      <th className="text-left py-2 px-3 text-[10px] font-medium text-white/40">Amount</th>
                      <th className="text-left py-2 px-3 text-[10px] font-medium text-white/40">Type</th>
                      <th className="text-left py-2 px-3 text-[10px] font-medium text-white/40">Method</th>
                      {isEditing && <th className="text-left py-2 px-3 text-[10px] font-medium text-white/40">Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {(currentData.paymentRecord || []).map((payment, idx) => {
                      const isNewRow = newPaymentIndices.includes(idx);
                      const isInvalidRow = invalidPaymentIndices.includes(idx);
                      
                      return (
                        <tr 
                          key={idx} 
                          id={`payment-row-${idx}`}
                          style={{ 
                            borderTop: idx > 0 ? '1px solid rgba(255, 255, 255, 0.06)' : 'none',
                            backgroundColor: isNewRow ? 'rgba(34, 197, 94, 0.05)' : 
                                          isInvalidRow ? 'rgba(239, 68, 68, 0.05)' : 
                                          'transparent',
                            borderLeft: isNewRow ? '2px solid #4ade80' : 
                                      isInvalidRow ? '2px solid #ef4444' : 
                                      'none',
                            transition: 'all 0.3s ease',
                          }}
                          className={`${isNewRow ? 'pulse-green' : ''} ${isInvalidRow ? 'pulse-red' : ''}`}
                        >
                          <td className="py-2 px-3 text-xs text-white/60">
                            {isEditing ? (
                              <DatePicker
                                value={payment.date || ''}
                                onChange={(val) => handlePaymentChange(idx, 'date', val)}
                                placeholder="Select date"
                                className="min-w-[120px] w-full"
                              />
                            ) : (
                              payment.date ? format(parseISO(payment.date), 'MMM d, yyyy') : '-'
                            )}
                          </td>
                          <td className="py-2 px-3 text-xs text-white/80 font-medium">
                            {isEditing ? (
                              <NumberInput
                                value={payment.amount || ''}
                                onChange={(val) => handlePaymentChange(idx, 'amount', val)}
                                placeholder="0"
                                min={0}
                                required
                                className="min-w-[80px] w-full"
                              />
                            ) : (
                              `₱${payment.amount || 0}`
                            )}
                          </td>
                          <td className="py-2 px-3">
                            {isEditing ? (
                              <Select
                                value={payment.type || 'full'}
                                onChange={(val) => handlePaymentChange(idx, 'type', val)}
                                options={paymentTypeOptions}
                                className="min-w-[90px] w-full"
                              />
                            ) : (
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                payment.type === 'full' 
                                  ? 'bg-green-500/20 text-green-400' 
                                  : 'bg-yellow-500/20 text-yellow-400'
                              }`}>
                                {payment.type || 'N/A'}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            {isEditing ? (
                              <Select
                                value={payment.method || 'cash'}
                                onChange={(val) => handlePaymentChange(idx, 'method', val)}
                                options={paymentMethodOptions}
                                className="min-w-[90px] w-full"
                              />
                            ) : (
                              <span className="text-xs text-white/40">{payment.method || 'Cash'}</span>
                            )}
                          </td>
                          {isEditing && (
                            <td className="py-2 px-3">
                              <button
                                onClick={() => handleRemovePayment(idx)}
                                className="text-white/30 hover:text-red-400 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="text-sm text-white/40 text-center py-6">No payment records</p>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default TuteeProfilePage;
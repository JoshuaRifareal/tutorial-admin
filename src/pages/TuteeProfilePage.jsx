import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Save, Calendar, DollarSign, Phone, Receipt, Users, Plus, X } from 'lucide-react';
import useTuteeStore from '../stores/tuteeStore';
import useTutorStore from '../stores/tutorStore';
import Header from '../components/common/Header';
import BottomNav from '../components/common/BottomNav';
import StatusChip from '../components/lists/StatusChip';
import Select from '../components/common/Select';
import DatePicker from '../components/common/DatePicker';
import TimePicker from '../components/common/TimePicker';
import { format, parseISO } from 'date-fns';
import HistoryButton from '../components/common/HistoryButton';
import { logEvent } from '../services/auditService';

const TuteeProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tutees, isLoading, fetchTutees, updateTutee } = useTuteeStore();
  const { tutors, fetchTutors } = useTutorStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(null);
  const [tutee, setTutee] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchTutees();
    fetchTutors();
  }, []);

  useEffect(() => {
    if (tutees.length > 0 && id) {
      const found = tutees.find(t => t.id === id);
      if (found) {
        setTutee(found);
        setFormData({ ...found });
      }
    }
  }, [tutees, id]);

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

  const getDaySchedule = (day) => {
    const schedule = tutee?.schedule || {};
    return schedule[day] || 'TBA';
  };

  const validateNumber = (field, value, min, max, required = false) => {
    if (value === '' || value === null || value === undefined) {
      if (required) {
        setErrors(prev => ({ ...prev, [field]: 'This field is required' }));
        return false;
      }
      setErrors(prev => ({ ...prev, [field]: '' }));
      return true;
    }
    
    const num = Number(value);
    if (isNaN(num)) {
      setErrors(prev => ({ ...prev, [field]: 'Must be a valid number' }));
      return false;
    }
    
    if (!Number.isInteger(num)) {
      setErrors(prev => ({ ...prev, [field]: 'Must be a whole number' }));
      return false;
    }
    
    if (min !== undefined && num < min) {
      setErrors(prev => ({ ...prev, [field]: `Minimum is ${min}` }));
      return false;
    }
    
    if (max !== undefined && num > max) {
      setErrors(prev => ({ ...prev, [field]: `Maximum is ${max}` }));
      return false;
    }
    
    setErrors(prev => ({ ...prev, [field]: '' }));
    return true;
  };

  const handleNumberChange = (field, value, min, max, required = false) => {
    handleChange(field, value);
    validateNumber(field, value, min, max, required);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setFormData({ ...tutee });
    setErrors({});
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({ ...tutee });
    setErrors({});
  };

  const handleSave = async () => {
    if (!formData) return;
    
    // Validate all number fields
    const isValid = 
      validateNumber('gradeLevel', formData.gradeLevel, 1, 12) &&
      validateNumber('rate', formData.rate, 0) &&
      validateNumber('balance', formData.balance, 0);
    
    // Validate payment amounts
    let paymentsValid = true;
    if (formData.paymentRecord) {
      formData.paymentRecord.forEach((payment, idx) => {
        if (payment.amount !== '' && payment.amount !== null && payment.amount !== undefined) {
          const valid = validateNumber(`payment_${idx}`, payment.amount, 0, undefined, true);
          if (!valid) paymentsValid = false;
        }
      });
    }
    
    if (!isValid || !paymentsValid) {
      return;
    }
    
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
    
    if (field === 'amount') {
      validateNumber(`payment_${index}`, value, 0, undefined, true);
    }
  };

  const handleRevert = async (entry) => {
    if (!entry || !entry.changes) return;
    
    setIsSaving(true);
    try {
      // Create a new state with the changes applied
      const revertedData = { ...tutee };
      const changes = entry.changes || {};
      
      // Apply each change from the audit entry
      Object.keys(changes).forEach(field => {
        revertedData[field] = changes[field].new;
      });
      
      // Update the profile
      await updateTutee(id, revertedData);
      
      // Log the revert action
      await logEvent({
        entityType: 'tutee',
        entityId: id,
        action: 'revert',
        changes: {
          revertedTo: entry.id,
          revertedFrom: new Date().toISOString(),
          fields: Object.keys(changes)
        },
        userEmail: 'admin@example.com' // Get from auth context
      });
      
      setIsEditing(false);
      setTutee(revertedData);
      
      // Show success message
      alert('Successfully reverted changes!');
    } catch (error) {
      console.error('Failed to revert:', error);
      alert('Failed to revert changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !tutee) {
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

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
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

  // Helper to render number input with validation
  const renderNumberInput = (field, value, placeholder, min, max, required = false) => {
    const hasError = errors[field] && errors[field] !== '';
    
    return (
      <div className="inline-flex flex-col">
        <input
          type="text"
          inputMode="numeric"
          value={value || ''}
          onChange={(e) => handleNumberChange(field, e.target.value, min, max, required)}
          placeholder={placeholder}
          className={`input-number ${hasError ? 'error' : ''}`}
        />
        {hasError && (
          <span className="input-error-text">{errors[field]}</span>
        )}
      </div>
    );
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
              isAdmin={true} // You can set this based on user role
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
                  <div className="flex flex-wrap items-center gap-2">
                    <Select
                      value={currentData.status || 'pending'}
                      onChange={(val) => handleChange('status', val)}
                      options={statusOptions}
                      className="min-w-[100px]"
                    />
                    {renderNumberInput('gradeLevel', currentData.gradeLevel, 'Grade', 1, 12)}
                    <input
                      type="text"
                      value={currentData.school || ''}
                      onChange={(e) => handleChange('school', e.target.value)}
                      placeholder="School"
                      className="input-dark"
                      style={{ flex: 1, minWidth: '120px' }}
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
          
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm text-white/60">Tutor:</span>
            {isEditing ? (
              <Select
                value={currentData.tutorId || ''}
                onChange={(val) => handleChange('tutorId', val)}
                options={[
                  { value: '', label: 'Unassigned' },
                  ...tutors.map(t => ({ value: t.id, label: `${t.firstName} ${t.lastName}` }))
                ]}
                className="min-w-[150px]"
              />
            ) : (
              <span className="text-sm text-white/80 font-medium">{getTutorName(currentData.tutorId)}</span>
            )}
          </div>
          
          {/* Schedule Table */}
          <div className="overflow-hidden rounded-xl" style={{ border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  {days.map((day) => (
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
                  {days.map((day, index) => {
                    const schedule = currentData.schedule || {};
                    const time = schedule[day] || 'TBA';
                    const isTBA = time === 'TBA';
                    
                    return (
                      <td 
                        key={day} 
                        className="text-center py-2 px-2 text-xs"
                        style={{ 
                          borderRight: index < days.length - 1 ? '1px solid rgba(255, 255, 255, 0.06)' : 'none',
                        }}
                      >
                        {isEditing ? (
                          <TimePicker
                            value={schedule[day] || ''}
                            onChange={(val) => handleScheduleChange(day, val)}
                            placeholder="TBA"
                            className="w-full"
                          />
                        ) : (
                          <span style={{ 
                            color: isTBA ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 1)',
                            fontWeight: isTBA ? '400' : '500',
                          }}>
                            {time}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 2: Enrollment Information */}
        <div className="glass-card p-5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-4 h-4 text-white/40" />
            <h3 className="text-sm font-medium text-white/80">Enrollment Information</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-1">
              <span className="text-white/40">Rate:</span>
              {isEditing ? (
                renderNumberInput('rate', currentData.rate, '0', 0)
              ) : (
                <span className="text-white/80">₱{currentData.rate || 0}</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-white/40">Package:</span>
              {isEditing ? (
                <Select
                  value={currentData.package || ''}
                  onChange={(val) => handleChange('package', val)}
                  options={packageOptions}
                  placeholder="Select"
                  className="w-24"
                />
              ) : (
                <span className="text-white/80">{currentData.package || '-'} hrs</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-white/40">Hrs/Session:</span>
              {isEditing ? (
                <Select
                  value={currentData.hoursPerSession || 1}
                  onChange={(val) => handleChange('hoursPerSession', parseFloat(val))}
                  options={hoursOptions}
                  className="w-24"
                />
              ) : (
                <span className="text-white/80">{currentData.hoursPerSession || 1} hr</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-white/40">Balance:</span>
              {isEditing ? (
                renderNumberInput('balance', currentData.balance, '0', 0)
              ) : (
                <span className="text-white/80">₱{currentData.balance || 0}</span>
              )}
            </div>
          </div>
        </div>

        {/* Card 3: Contact Information */}
        <div className="glass-card p-5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Phone className="w-4 h-4 text-white/40" />
            <h3 className="text-sm font-medium text-white/80">Contact Information</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-1">
              <span className="text-white/40">Name:</span>
              {isEditing ? (
                <input
                  type="text"
                  value={currentData.guardianName || ''}
                  onChange={(e) => handleChange('guardianName', e.target.value)}
                  placeholder="Guardian Name"
                  className="input-dark-sm"
                  style={{ width: '200px' }}
                />
              ) : (
                <span className="text-white/80">{currentData.guardianName || '-'}</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-white/40">Contact:</span>
              {isEditing ? (
                <input
                  type="text"
                  value={currentData.guardianContact || ''}
                  onChange={(e) => handleChange('guardianContact', e.target.value)}
                  placeholder="Contact Number"
                  className="input-dark-sm"
                  style={{ width: '200px' }}
                />
              ) : (
                <span className="text-white/80">{currentData.guardianContact || '-'}</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-white/40">Emergency:</span>
              {isEditing ? (
                <input
                  type="text"
                  value={currentData.emergencyContact || ''}
                  onChange={(e) => handleChange('emergencyContact', e.target.value)}
                  placeholder="Emergency Contact"
                  className="input-dark-sm"
                  style={{ width: '200px' }}
                />
              ) : (
                <span className="text-white/80">{currentData.emergencyContact || '-'}</span>
              )}
            </div>
            {siblingNames.length > 0 && (
              <div className="pt-2" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-sm text-white/40">Siblings:</span>
                </div>
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
        </div>

        {/* Card 4: Payment History */}
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
                      const hasError = errors[`payment_${idx}`] && errors[`payment_${idx}`] !== '';
                      return (
                        <tr 
                          key={idx} 
                          style={{ borderTop: idx > 0 ? '1px solid rgba(255, 255, 255, 0.06)' : 'none' }}
                        >
                          <td className="py-2 px-3 text-xs text-white/60">
                            {isEditing ? (
                              <DatePicker
                                value={payment.date || ''}
                                onChange={(val) => handlePaymentChange(idx, 'date', val)}
                                placeholder="Select date"
                                className="w-32"
                              />
                            ) : (
                              payment.date ? format(parseISO(payment.date), 'MMM d, yyyy') : '-'
                            )}
                          </td>
                          <td className="py-2 px-3">
                            {isEditing ? (
                              <div className="inline-flex flex-col">
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={payment.amount || ''}
                                  onChange={(e) => handlePaymentChange(idx, 'amount', e.target.value)}
                                  placeholder="0"
                                  className={`input-number ${hasError ? 'error' : ''}`}
                                />
                                {hasError && (
                                  <span className="input-error-text">{errors[`payment_${idx}`]}</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-white/80 font-medium">₱{payment.amount || 0}</span>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            {isEditing ? (
                              <Select
                                value={payment.type || 'full'}
                                onChange={(val) => handlePaymentChange(idx, 'type', val)}
                                options={paymentTypeOptions}
                                className="w-24"
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
                                className="w-24"
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
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Save, Calendar, DollarSign, Phone, Receipt, Users, Plus, X } from 'lucide-react';
import useTuteeStore from '../stores/tuteeStore';
import useTutorStore from '../stores/tutorStore';
import Header from '../components/common/Header';
import BottomNav from '../components/common/BottomNav';
import StatusChip from '../components/lists/StatusChip';
import { format, parseISO } from 'date-fns';

const TuteeProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tutees, isLoading, fetchTutees, updateTutee } = useTuteeStore();
  const { tutors, fetchTutors } = useTutorStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(null);
  const [tutee, setTutee] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

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
    const schedule = tutee?.schedule || { days: [], time: '' };
    return schedule.days?.includes(day) ? schedule.time : 'TBA';
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
      const schedule = prev.schedule || { days: [], time: '' };
      let days = [...schedule.days];
      
      if (value && value !== 'TBA') {
        if (!days.includes(day)) {
          days.push(day);
        }
        return { 
          ...prev, 
          schedule: { 
            days, 
            time: value 
          } 
        };
      } else {
        days = days.filter(d => d !== day);
        return { 
          ...prev, 
          schedule: { 
            days, 
            time: schedule.time 
          } 
        };
      }
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

        {/* Profile Header - Editable Status */}
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
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-purple-500"
                    />
                    <input
                      type="text"
                      value={currentData.lastName || ''}
                      onChange={(e) => handleChange('lastName', e.target.value)}
                      placeholder="Last Name"
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <select
                      value={currentData.status || 'pending'}
                      onChange={(e) => handleChange('status', e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-purple-500"
                    >
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                      <option value="inactive">Inactive</option>
                    </select>
                    <input
                      type="text"
                      value={currentData.gradeLevel || ''}
                      onChange={(e) => handleChange('gradeLevel', e.target.value)}
                      placeholder="Grade"
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm w-20 focus:outline-none focus:border-purple-500"
                    />
                    <input
                      type="text"
                      value={currentData.school || ''}
                      onChange={(e) => handleChange('school', e.target.value)}
                      placeholder="School"
                      className="flex-1 min-w-[120px] bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-purple-500"
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
              <select
                value={currentData.tutorId || ''}
                onChange={(e) => handleChange('tutorId', e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-white text-sm focus:outline-none focus:border-purple-500"
              >
                <option value="">Unassigned</option>
                {tutors.map(t => (
                  <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>
                ))}
              </select>
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
                    const schedule = currentData.schedule || { days: [], time: '' };
                    const hasDay = schedule.days?.includes(day);
                    const time = hasDay ? schedule.time : 'TBA';
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
                          <input
                            type="text"
                            value={hasDay ? schedule.time : ''}
                            onChange={(e) => handleScheduleChange(day, e.target.value)}
                            placeholder="TBA"
                            className="w-full bg-transparent text-center text-white/70 font-medium text-xs focus:outline-none focus:bg-white/5 rounded px-1 py-0.5"
                          />
                        ) : (
                          <span className={isTBA ? 'text-white/30' : 'text-white/70 font-medium'}>
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
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-white/40">Rate:</span>
              {isEditing ? (
                <input
                  type="number"
                  value={currentData.rate || 0}
                  onChange={(e) => handleChange('rate', parseFloat(e.target.value) || 0)}
                  className="bg-white/5 border border-white/10 rounded-lg px-2 py-0.5 text-white text-sm w-20 ml-2 focus:outline-none focus:border-purple-500"
                />
              ) : (
                <span className="text-white/80 ml-2">₱{currentData.rate || 0}</span>
              )}
            </div>
            <div>
              <span className="text-white/40">Package:</span>
              {isEditing ? (
                <select
                  value={currentData.package || ''}
                  onChange={(e) => handleChange('package', e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg px-2 py-0.5 text-white text-sm ml-2 focus:outline-none focus:border-purple-500"
                >
                  <option value="">Select</option>
                  <option value="20">20 hrs</option>
                  <option value="30">30 hrs</option>
                  <option value="40">40 hrs</option>
                </select>
              ) : (
                <span className="text-white/80 ml-2">{currentData.package || '-'} hrs</span>
              )}
            </div>
            <div>
              <span className="text-white/40">Hrs/Session:</span>
              {isEditing ? (
                <select
                  value={currentData.hoursPerSession || 1}
                  onChange={(e) => handleChange('hoursPerSession', parseFloat(e.target.value))}
                  className="bg-white/5 border border-white/10 rounded-lg px-2 py-0.5 text-white text-sm ml-2 focus:outline-none focus:border-purple-500"
                >
                  <option value="1">1 hr</option>
                  <option value="1.5">1.5 hrs</option>
                  <option value="2">2 hrs</option>
                </select>
              ) : (
                <span className="text-white/80 ml-2">{currentData.hoursPerSession || 1} hr</span>
              )}
            </div>
            <div>
              <span className="text-white/40">Balance:</span>
              {isEditing ? (
                <input
                  type="number"
                  value={currentData.balance || 0}
                  onChange={(e) => handleChange('balance', parseFloat(e.target.value) || 0)}
                  className="bg-white/5 border border-white/10 rounded-lg px-2 py-0.5 text-white text-sm w-20 ml-2 focus:outline-none focus:border-purple-500"
                />
              ) : (
                <span className="text-white/80 ml-2">₱{currentData.balance || 0}</span>
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
            <div>
              <span className="text-white/40">Name:</span>
              {isEditing ? (
                <input
                  type="text"
                  value={currentData.guardianName || ''}
                  onChange={(e) => handleChange('guardianName', e.target.value)}
                  placeholder="Guardian Name"
                  className="bg-white/5 border border-white/10 rounded-lg px-2 py-0.5 text-white text-sm ml-2 w-40 focus:outline-none focus:border-purple-500"
                />
              ) : (
                <span className="text-white/80 ml-2">{currentData.guardianName || '-'}</span>
              )}
            </div>
            <div>
              <span className="text-white/40">Contact:</span>
              {isEditing ? (
                <input
                  type="text"
                  value={currentData.guardianContact || ''}
                  onChange={(e) => handleChange('guardianContact', e.target.value)}
                  placeholder="Contact Number"
                  className="bg-white/5 border border-white/10 rounded-lg px-2 py-0.5 text-white text-sm ml-2 w-40 focus:outline-none focus:border-purple-500"
                />
              ) : (
                <span className="text-white/80 ml-2">{currentData.guardianContact || '-'}</span>
              )}
            </div>
            <div>
              <span className="text-white/40">Emergency:</span>
              {isEditing ? (
                <input
                  type="text"
                  value={currentData.emergencyContact || ''}
                  onChange={(e) => handleChange('emergencyContact', e.target.value)}
                  placeholder="Emergency Contact"
                  className="bg-white/5 border border-white/10 rounded-lg px-2 py-0.5 text-white text-sm ml-2 w-40 focus:outline-none focus:border-purple-500"
                />
              ) : (
                <span className="text-white/80 ml-2">{currentData.emergencyContact || '-'}</span>
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
            <div className="overflow-hidden rounded-xl" style={{ border: '1px solid rgba(255, 255, 255, 0.06)' }}>
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
                  {(currentData.paymentRecord || []).map((payment, idx) => (
                    <tr 
                      key={idx} 
                      style={{ borderTop: idx > 0 ? '1px solid rgba(255, 255, 255, 0.06)' : 'none' }}
                    >
                      <td className="py-2 px-3 text-xs text-white/60">
                        {isEditing ? (
                          <input
                            type="date"
                            value={payment.date || ''}
                            onChange={(e) => handlePaymentChange(idx, 'date', e.target.value)}
                            className="bg-transparent text-white text-xs w-24 focus:outline-none focus:bg-white/5 rounded px-1"
                          />
                        ) : (
                          payment.date ? format(parseISO(payment.date), 'MMM d, yyyy') : '-'
                        )}
                      </td>
                      <td className="py-2 px-3 text-xs text-white/80 font-medium">
                        {isEditing ? (
                          <input
                            type="number"
                            value={payment.amount || ''}
                            onChange={(e) => handlePaymentChange(idx, 'amount', e.target.value)}
                            placeholder="0"
                            className="bg-transparent text-white text-xs w-16 focus:outline-none focus:bg-white/5 rounded px-1"
                          />
                        ) : (
                          `₱${payment.amount || 0}`
                        )}
                      </td>
                      <td className="py-2 px-3">
                        {isEditing ? (
                          <select
                            value={payment.type || 'full'}
                            onChange={(e) => handlePaymentChange(idx, 'type', e.target.value)}
                            className="bg-transparent text-white text-xs border border-white/10 rounded px-1 py-0.5 focus:outline-none focus:border-purple-500"
                          >
                            <option value="full">Full</option>
                            <option value="installment">Installment</option>
                          </select>
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
                          <select
                            value={payment.method || 'cash'}
                            onChange={(e) => handlePaymentChange(idx, 'method', e.target.value)}
                            className="bg-transparent text-white text-xs border border-white/10 rounded px-1 py-0.5 focus:outline-none focus:border-purple-500"
                          >
                            <option value="cash">Cash</option>
                            <option value="online">Online</option>
                          </select>
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
                  ))}
                </tbody>
              </table>
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
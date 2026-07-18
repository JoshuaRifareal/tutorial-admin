import { v4 as uuidv4 } from 'uuid';

// Parse Google Sheets row to Tutee object
export const parseTuteeRow = (row) => {
  if (!row || row.length < 18) return null;
  
  try {
    return {
      id: row[0] || `tutee_${Date.now()}_${Math.random()}`,
      firstName: row[1] || '',
      lastName: row[2] || '',
      gradeLevel: row[3] || '',
      school: row[4] || '',
      enrollmentDate: row[5] || '',
      startDate: row[6] || '',
      endDate: row[7] || '',
      rate: parseFloat(row[8]) || 0,
      package: row[9] || '',
      hoursPerSession: parseFloat(row[10]) || 1,
      schedule: row[11] ? JSON.parse(row[11]) : {},
      paymentRecord: row[12] ? JSON.parse(row[12]).map(p => ({
        amount: p.amount || '',
        type: p.type || 'full',
        date: p.date || '',
        method: p.method || 'cash'
      })) : [],
      balance: parseFloat(row[13]) || 0,
      renewalDate: row[14] || '',
      tutorId: row[15] || '',
      isInGroupChat: row[16] === 'TRUE',
      hasAdmissionForm: row[17] === 'TRUE',
      hasPolicies: row[18] === 'TRUE',
      siblings: row[19] ? JSON.parse(row[19]) : [],
      guardianName: row[20] || '',
      guardianContact: row[21] || '',
      emergencyContact: row[22] || '',
      status: row[23] || 'pending',
      isDeleted: row[24] === 'TRUE',
      deletedAt: row[25] || '',
      createdAt: row[26] || new Date().toISOString(),
      updatedAt: row[27] || new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error parsing tutee row:', row, error);
    return null;
  }
};

// Parse Google Sheets row to Tutor object
export const parseTutorRow = (row) => {
  if (!row || row.length < 8) return null;
  
  try {
    const id = row[0] || `tutor_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    console.log('Parsing tutor row, ID:', id);
    
    return {
      id: id,
      firstName: row[1] || '',
      lastName: row[2] || '',
      school: row[3] || '',
      program: row[4] || '',
      major: row[5] || '',
      tutees: row[6] ? JSON.parse(row[6]) : [],
      isDeleted: row[7] === 'TRUE',
      deletedAt: row[8] || '',
      createdAt: row[9] || new Date().toISOString(),
      updatedAt: row[10] || new Date().toISOString(),
      substitutions: row[11] ? JSON.parse(row[11]) : [],
    };
  } catch (error) {
    console.error('Error parsing tutor row:', row, error);
    return null;
  }
};

// Convert Tutee object to array for Google Sheets
export const tuteeToRow = (tutee) => {
  return [
    tutee.id,
    tutee.firstName,
    tutee.lastName,
    tutee.gradeLevel,
    tutee.school,
    tutee.enrollmentDate,
    tutee.startDate,
    tutee.endDate,
    tutee.rate.toString(),
    tutee.package,
    tutee.hoursPerSession.toString(),
    JSON.stringify(tutee.schedule || {}),
    JSON.stringify(tutee.paymentRecord),
    tutee.balance.toString(),
    tutee.renewalDate,
    tutee.tutorId || '',
    tutee.isInGroupChat ? 'TRUE' : 'FALSE',
    tutee.hasAdmissionForm ? 'TRUE' : 'FALSE',
    tutee.hasPolicies ? 'TRUE' : 'FALSE',
    JSON.stringify(tutee.siblings || []),
    tutee.guardianName || '',
    tutee.guardianContact || '',
    tutee.emergencyContact || '',
    tutee.status || 'pending',
    tutee.isDeleted ? 'TRUE' : 'FALSE',
    tutee.deletedAt || '',
    tutee.createdAt || new Date().toISOString(),
    tutee.updatedAt || new Date().toISOString(),
  ];
};

// Convert Tutor object to array for Google Sheets
export const tutorToRow = (tutor) => {
  return [
    tutor.id,
    tutor.firstName,
    tutor.lastName,
    tutor.school || '',
    tutor.program || '',
    tutor.major || '',
    JSON.stringify(tutor.tutees || []),
    tutor.isDeleted ? 'TRUE' : 'FALSE',
    tutor.deletedAt || '',
    tutor.createdAt || new Date().toISOString(),
    tutor.updatedAt || new Date().toISOString(),
    JSON.stringify(tutor.substitutions || []),
  ];
};
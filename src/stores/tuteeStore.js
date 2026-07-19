import { create } from 'zustand';
import { fetchSheetData, appendToSheet, updateSheetRange } from '../services/googleSheets';
import { parseTuteeRow, tuteeToRow } from '../utils/dataHelpers';
import { v4 as uuidv4 } from 'uuid';
import { logEvent } from '../services/auditService';

const useTuteeStore = create((set, get) => ({
  tutees: [],
  isLoading: false,
  error: null,
  
  // Fetch all tutees from Google Sheets
  fetchTutees: async () => {
    set({ isLoading: true, error: null });
    try {
      const rows = await fetchSheetData('tutees');
      if (!rows || rows.length === 0) {
        console.warn('No data found in tutees sheet');
        set({ tutees: [], isLoading: false });
        return [];
      }
      const dataRows = rows.slice(1);
      const tutees = dataRows
        .map(parseTuteeRow)
        .filter(t => t !== null && !t.isDeleted); // This filters out deleted entries
      
      set({ tutees, isLoading: false });
      return tutees;
    } catch (error) {
      console.error('Error in fetchTutees:', error);
      set({ 
        error: error.message || 'Failed to fetch tutees', 
        isLoading: false,
        tutees: [],
      });
      throw error;
    }
  },
  
  // Get a single tutee by ID
  getTuteeById: (id) => {
    return get().tutees.find(t => t.id === id);
  },
  
  // Add a new tutee
  addTutee: async (tuteeData) => {
    set({ isLoading: true, error: null });
    try {
      const newTutee = {
        ...tuteeData,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDeleted: false,
        paymentRecord: tuteeData.paymentRecord || [],
        // Ensure balance is calculated if not provided
        balance: tuteeData.balance || (tuteeData.rate * parseInt(tuteeData.package) || 0),
      };
      
      const row = tuteeToRow(newTutee);
      await appendToSheet('tutees', row);
      
      set(state => ({
        tutees: [...state.tutees, newTutee],
        isLoading: false,
      }));
      
      return newTutee;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },
  
  // Update an existing tutee
  updateTutee: async (id, updatedData) => {
    set({ isLoading: true, error: null });
    try {
      const state = get();
      const index = state.tutees.findIndex(t => t.id === id);
      
      if (index === -1) {
        throw new Error('Tutee not found');
      }
      
      const oldTutee = state.tutees[index];
      
      // Track changes for audit log - exclude updatedAt
      const changes = {};
      Object.keys(updatedData).forEach(key => {
        if (key === 'updatedAt') return;
        
        const oldValue = oldTutee[key];
        const newValue = updatedData[key];
        
        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
          changes[key] = { 
            old: oldValue, 
            new: newValue 
          };
        }
      });
      
      const updatedTutee = {
        ...oldTutee,
        ...updatedData,
        updatedAt: new Date().toISOString(),
      };
      
      // IMPORTANT: Make sure we use UPDATE range, not APPEND
      const rowNumber = index + 2; // +2 because of header and 0-index
      const range = `tutees!A${rowNumber}:AC${rowNumber}`;
      const row = tuteeToRow(updatedTutee);
      
      // This should be updateSheetRange, NOT appendToSheet
      await updateSheetRange(range, row);
      
      // Update local state
      const newTutees = [...state.tutees];
      newTutees[index] = updatedTutee;
      
      // Log the changes if there are any
      if (Object.keys(changes).length > 0) {
        const userEmail = localStorage.getItem('google_oauth_user') 
          ? JSON.parse(localStorage.getItem('google_oauth_user')).email 
          : 'system';
        
        await logEvent({
          entityType: 'tutee',
          entityId: id,
          changes,
          action: 'update',
          userEmail: userEmail,
        });
      }
      
      set({ tutees: newTutees, isLoading: false });
      return updatedTutee;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },
  
  // Soft delete a tutee
  deleteTutee: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const state = get();
      const tutee = state.tutees.find(t => t.id === id);
      
      if (!tutee) {
        throw new Error('Tutee not found');
      }
      
      const updatedTutee = {
        ...tutee,
        isDeleted: true,
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      const index = state.tutees.findIndex(t => t.id === id);
      const rowNumber = index + 2;
      const range = `tutees!A${rowNumber}:AC${rowNumber}`;
      const row = tuteeToRow(updatedTutee);
      
      await updateSheetRange(range, row);
      
      // Update local state - filter out the deleted tutee
      set(state => ({
        tutees: state.tutees.filter(t => t.id !== id),
        isLoading: false,
      }));
      
      return updatedTutee;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },
}));

export default useTuteeStore;
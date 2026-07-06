import { create } from 'zustand';
import { fetchSheetData, appendToSheet, updateSheetRange } from '../services/googleSheets';
import { parseTutorRow, tutorToRow } from '../utils/dataHelpers';
import { v4 as uuidv4 } from 'uuid';

const useTutorStore = create((set, get) => ({
  tutors: [],
  isLoading: false,
  error: null,
  
  fetchTutors: async () => {
    set({ isLoading: true, error: null });
    try {
      const rows = await fetchSheetData('tutors');
      if (!rows || rows.length === 0) {
        console.warn('No data found in tutors sheet');
        set({ tutors: [], isLoading: false });
        return [];
      }
      // Skip header row (first row)
      const dataRows = rows.slice(1);
      const tutors = dataRows
        .map(parseTutorRow)
        .filter(t => t !== null && !t.isDeleted);
      
      console.log('Fetched tutors:', tutors.length);
      set({ tutors, isLoading: false });
      return tutors;
    } catch (error) {
      console.error('Error in fetchTutors:', error);
      set({ 
        error: error.message || 'Failed to fetch tutors', 
        isLoading: false,
        tutors: [],
      });
      throw error;
    }
  },
  
  getTutorById: (id) => {
    return get().tutors.find(t => t.id === id);
  },
  
  addTutor: async (tutorData) => {
    set({ isLoading: true, error: null });
    try {
      const newTutor = {
        ...tutorData,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDeleted: false,
        tutees: [],
      };
      
      const row = tutorToRow(newTutor);
      await appendToSheet('tutors', row);
      
      set(state => ({
        tutors: [...state.tutors, newTutor],
        isLoading: false,
      }));
      
      return newTutor;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },
  
  updateTutor: async (id, updatedData) => {
    set({ isLoading: true, error: null });
    try {
      const state = get();
      const index = state.tutors.findIndex(t => t.id === id);
      
      if (index === -1) {
        throw new Error('Tutor not found');
      }
      
      const oldTutor = state.tutors[index];
      const updatedTutor = {
        ...oldTutor,
        ...updatedData,
        updatedAt: new Date().toISOString(),
      };
      
      const rowNumber = index + 2;
      const range = `tutors!A${rowNumber}:K${rowNumber}`;
      const row = tutorToRow(updatedTutor);
      
      await updateSheetRange(range, row);
      
      const newTutors = [...state.tutors];
      newTutors[index] = updatedTutor;
      
      set({ tutors: newTutors, isLoading: false });
      return updatedTutor;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },
  
  deleteTutor: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const state = get();
      const tutor = state.tutors.find(t => t.id === id);
      
      if (!tutor) {
        throw new Error('Tutor not found');
      }
      
      const updatedTutor = {
        ...tutor,
        isDeleted: true,
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      const index = state.tutors.findIndex(t => t.id === id);
      const rowNumber = index + 2;
      const range = `tutors!A${rowNumber}:K${rowNumber}`;
      const row = tutorToRow(updatedTutor);
      
      await updateSheetRange(range, row);
      
      set(state => ({
        tutors: state.tutors.filter(t => t.id !== id),
        isLoading: false,
      }));
      
      return updatedTutor;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },
}));

export default useTutorStore;
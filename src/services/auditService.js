import { v4 as uuidv4 } from 'uuid';
import { appendToSheet, fetchSheetData } from './googleSheets';

const AUDIT_SHEET = 'audit_log';

// Log an event to the audit log
export const logEvent = async ({ entityType, entityId, changes, action = 'update', userEmail }) => {
  try {
    const entry = [
      uuidv4(),
      new Date().toISOString(),
      userEmail || 'system',
      entityType,
      entityId,
      JSON.stringify(changes),
      action,
    ];
    
    await appendToSheet(AUDIT_SHEET, entry);
    console.log('Audit log entry created:', { entityType, entityId, action });
    return true;
  } catch (error) {
    console.error('Failed to log event:', error);
    return false;
  }
};

// Get history for a specific entity
export const getEntityHistory = async (entityType, entityId, limit = 20, offset = 0) => {
  try {
    const rows = await fetchSheetData(AUDIT_SHEET);
    if (!rows || rows.length <= 1) return { entries: [], total: 0 };
    
    // Skip header row
    const dataRows = rows.slice(1);
    
    // Filter by entityType and entityId
    const filtered = dataRows.filter(row => {
      const rowEntityType = row[3] || '';
      const rowEntityId = row[4] || '';
      return rowEntityType === entityType && rowEntityId === entityId;
    });
    
    // Sort by timestamp descending (newest first)
    const sorted = filtered.sort((a, b) => {
      const dateA = new Date(a[1] || 0);
      const dateB = new Date(b[1] || 0);
      return dateB - dateA;
    });
    
    const total = sorted.length;
    
    // Paginate
    const paginated = sorted.slice(offset, offset + limit);
    
    // Parse and format entries
    const entries = paginated.map(row => ({
      id: row[0] || '',
      timestamp: row[1] || '',
      userEmail: row[2] || 'system',
      entityType: row[3] || '',
      entityId: row[4] || '',
      changes: row[5] ? JSON.parse(row[5]) : {},
      action: row[6] || 'update',
    }));
    
    return { entries, total };
  } catch (error) {
    console.error('Failed to get entity history:', error);
    return { entries: [], total: 0 };
  }
};

// Get all history for an entity (no limit - for "View All" modal)
export const getAllEntityHistory = async (entityType, entityId) => {
  try {
    const rows = await fetchSheetData(AUDIT_SHEET);
    if (!rows || rows.length <= 1) return [];
    
    const dataRows = rows.slice(1);
    
    const filtered = dataRows.filter(row => {
      const rowEntityType = row[3] || '';
      const rowEntityId = row[4] || '';
      return rowEntityType === entityType && rowEntityId === entityId;
    });
    
    const sorted = filtered.sort((a, b) => {
      const dateA = new Date(a[1] || 0);
      const dateB = new Date(b[1] || 0);
      return dateB - dateA;
    });
    
    return sorted.map(row => ({
      id: row[0] || '',
      timestamp: row[1] || '',
      userEmail: row[2] || 'system',
      entityType: row[3] || '',
      entityId: row[4] || '',
      changes: row[5] ? JSON.parse(row[5]) : {},
      action: row[6] || 'update',
    }));
  } catch (error) {
    console.error('Failed to get all entity history:', error);
    return [];
  }
};
const SPREADSHEET_ID = import.meta.env.VITE_GOOGLE_SHEET_ID;
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

// Base URL for Google Sheets API v4
const BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets';

// Utility to fetch data from a sheet
export const fetchSheetData = async (sheetName) => {
  try {
    // First, check if we have the required env variables
    if (!SPREADSHEET_ID || !API_KEY) {
      console.error('Missing environment variables:', {
        hasSheetId: !!SPREADSHEET_ID,
        hasApiKey: !!API_KEY,
      });
      throw new Error('Missing Google Sheets configuration. Please check your .env.local file.');
    }

    const url = `${BASE_URL}/${SPREADSHEET_ID}/values/${sheetName}?key=${API_KEY}`;
    console.log(`Fetching from: ${url.replace(API_KEY, 'HIDDEN')}`); // Log without exposing API key
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Response error:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText,
      });
      
      if (response.status === 403) {
        throw new Error(
          `Cannot access Google Sheet. Please check:\n` +
          `1. The sheet is shared with your service account or set to public\n` +
          `2. The Sheet ID is correct\n` +
          `3. The API key has Sheets API enabled\n` +
          `4. The sheet name "${sheetName}" exists`
        );
      }
      
      throw new Error(`Failed to fetch ${sheetName}: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`Successfully fetched ${sheetName} data:`, {
      rows: data.values?.length || 0,
    });
    
    return data.values || [];
  } catch (error) {
    console.error(`Error fetching ${sheetName}:`, error);
    throw error;
  }
};

// Utility to append data to a sheet
export const appendToSheet = async (sheetName, values) => {
  try {
    const url = `${BASE_URL}/${SPREADSHEET_ID}/values/${sheetName}:append?valueInputOption=RAW&key=${API_KEY}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [values],
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to append to ${sheetName}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error appending to ${sheetName}:`, error);
    throw error;
  }
};

// Utility to update a specific cell/range
export const updateSheetRange = async (range, values) => {
  try {
    const url = `${BASE_URL}/${SPREADSHEET_ID}/values/${range}?valueInputOption=RAW&key=${API_KEY}`;
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [values],
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update ${range}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error updating ${range}:`, error);
    throw error;
  }
};
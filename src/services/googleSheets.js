const SPREADSHEET_ID = import.meta.env.VITE_GOOGLE_SHEET_ID;
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets';

// OAuth token management
let oauthToken = null;
let tokenExpiry = null;

export const setOAuthToken = (token, expiresIn) => {
  oauthToken = token;
  tokenExpiry = Date.now() + (expiresIn * 1000);
};

export const getOAuthToken = () => {
  if (!oauthToken || Date.now() >= tokenExpiry) {
    return null;
  }
  return oauthToken;
};

export const clearOAuthToken = () => {
  oauthToken = null;
  tokenExpiry = null;
};

// Check if we have a valid token
const hasValidToken = () => {
  return oauthToken && Date.now() < tokenExpiry;
};

// Get auth headers
const getAuthHeaders = () => {
  // Use OAuth token first, fallback to API key
  if (hasValidToken()) {
    return {
      'Authorization': `Bearer ${oauthToken}`,
      'Content-Type': 'application/json',
    };
  }
  // If no OAuth token, try API key as fallback
  if (API_KEY) {
    return {
      'Content-Type': 'application/json',
    };
  }
  throw new Error('No authentication method available');
};

// Get URL with API key as fallback
const getUrlWithAuth = (baseUrl) => {
  if (hasValidToken()) {
    return baseUrl;
  }
  return `${baseUrl}&key=${API_KEY}`;
};

// Utility to fetch data from a sheet
export const fetchSheetData = async (sheetName) => {
  try {
    if (!SPREADSHEET_ID) {
      throw new Error('Missing Google Sheet ID. Please check your environment variables.');
    }

    let url = `${BASE_URL}/${SPREADSHEET_ID}/values/${sheetName}`;
    
    // Use OAuth or API key
    if (hasValidToken()) {
      url = `${url}?access_token=${oauthToken}`;
    } else if (API_KEY) {
      url = `${url}?key=${API_KEY}`;
    } else {
      throw new Error('No authentication method available. Please log in.');
    }

    console.log('Fetching from sheet:', sheetName);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Fetch error:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText,
      });
      
      if (response.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      }
      
      if (response.status === 403) {
        throw new Error('Access denied. Please check your permissions.');
      }
      
      throw new Error(`Failed to fetch ${sheetName}: ${response.statusText}`);
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
    if (!SPREADSHEET_ID) {
      throw new Error('Missing Google Sheet ID.');
    }

    if (!hasValidToken()) {
      throw new Error('Not authenticated. Please log in to make changes.');
    }

    const url = `${BASE_URL}/${SPREADSHEET_ID}/values/${sheetName}:append?valueInputOption=USER_ENTERED`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${oauthToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [values],
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Append error:', errorText);
      
      if (response.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      }
      
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
    if (!SPREADSHEET_ID) {
      throw new Error('Missing Google Sheet ID.');
    }

    if (!hasValidToken()) {
      throw new Error('Not authenticated. Please log in to make changes.');
    }

    const url = `${BASE_URL}/${SPREADSHEET_ID}/values/${range}?valueInputOption=USER_ENTERED`;
    console.log('Updating range:', range);
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${oauthToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [values],
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Update error:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText,
      });
      
      if (response.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      }
      
      if (response.status === 403) {
        throw new Error('Access denied. Please check your permissions.');
      }
      
      throw new Error(`Failed to update ${range}: ${response.statusText}`);
    }
    
    console.log(`Successfully updated ${range}`);
    return await response.json();
  } catch (error) {
    console.error(`Error updating ${range}:`, error);
    throw error;
  }
};
/**
 * Google API Service
 * Contains functions for interacting with Google Drive and Google Sheets
 */

// Function to fetch a list of Google Sheets from Drive
export const fetchSheetsList = async (accessToken) => {
    try {
      const response = await fetch(
        'https://www.googleapis.com/drive/v3/files?q=mimeType="application/vnd.google-apps.spreadsheet"&fields=files(id,name)',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
  
      if (!response.ok) {
        throw new Error('Failed to fetch sheets from Google Drive');
      }
  
      const data = await response.json();
      return data.files;
    } catch (error) {
      console.error('Error fetching sheets list:', error);
      throw error;
    }
  };
  
  // Function to read data from a Google Sheet
  export const readSheetData = async (sheetId, accessToken, range = 'Sheet1') => {
    try {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
  
      if (!response.ok) {
        throw new Error('Failed to read data from Google Sheet');
      }
  
      const data = await response.json();
      return data.values || [];
    } catch (error) {
      console.error('Error reading sheet data:', error);
      throw error;
    }
  };
  
  // Function to append a row to a Google Sheet
  export const appendSheetRow = async (sheetId, accessToken, values, range = 'Sheet1') => {
    try {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}:append?valueInputOption=USER_ENTERED`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            range,
            majorDimension: 'ROWS',
            values: [values],
          }),
        }
      );
  
      if (!response.ok) {
        throw new Error('Failed to append data to Google Sheet');
      }
  
      return await response.json();
    } catch (error) {
      console.error('Error appending row to sheet:', error);
      throw error;
    }
  };
  
  // Function to update a specific row in a Google Sheet
  export const updateSheetRow = async (sheetId, accessToken, rowIndex, values, range = 'Sheet1') => {
    try {
      const updateRange = `${range}!A${rowIndex}:Q${rowIndex}`;
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${updateRange}?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            range: updateRange,
            majorDimension: 'ROWS',
            values: [values],
          }),
        }
      );
  
      if (!response.ok) {
        throw new Error('Failed to update data in Google Sheet');
      }
  
      return await response.json();
    } catch (error) {
      console.error('Error updating row in sheet:', error);
      throw error;
    }
  };
  
  // Function to find a row by a specific value in a column
  export const findRowByValue = async (sheetId, accessToken, searchValue, columnIndex = 0, range = 'Sheet1') => {
    try {
      const data = await readSheetData(sheetId, accessToken, range);
      
      // Find the row with the matching value in the specified column
      for (let i = 0; i < data.length; i++) {
        if (data[i][columnIndex] === searchValue) {
          return {
            rowIndex: i + 1, // Sheet rows are 1-indexed
            rowData: data[i],
          };
        }
      }
      
      return null; // Not found
    } catch (error) {
      console.error('Error finding row:', error);
      throw error;
    }
  };
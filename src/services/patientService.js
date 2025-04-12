import {
    readSheetData,
    appendSheetRow,
    updateSheetRow,
    findRowByValue
  } from './googleApi';
  
  // Map sheet row data to patient object
  const mapRowToPatient = (row) => {
    if (!row || row.length === 0) return null;
    
    return {
      patientId: row[0] || '',
      firstName: row[1] || '',
      lastName: row[2] || '',
      location: row[3] || '',
      phone: row[4] || '',
      address: row[5] || '',
      age: row[6] || '',
      gender: row[7] || '',
      physicianId: row[8] || '',
      physicianFirstName: row[9] || '',
      physicianLastName: row[10] || '',
      physicianPhone: row[11] || '',
      bill: row[12] || '',
      prescription: row[13] || '',
      dose: row[14] || '',
      visitDate: row[15] ? new Date(row[15]) : null,
      nextVisit: row[16] ? new Date(row[16]) : null,
    };
  };
  
  // Map patient object to sheet row data
  const mapPatientToRow = (patient) => {
    const formatDate = (date) => {
      if (!date) return '';
      const d = new Date(date);
      return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
    };
    
    return [
      patient.patientId,
      patient.firstName,
      patient.lastName,
      patient.location,
      patient.phone,
      patient.address,
      patient.age,
      patient.gender,
      patient.physicianId,
      patient.physicianFirstName,
      patient.physicianLastName,
      patient.physicianPhone,
      patient.bill,
      patient.prescription,
      patient.dose,
      formatDate(patient.visitDate),
      formatDate(patient.nextVisit),
    ];
  };
  
  // Generate a unique patient ID
  export const generatePatientId = () => {
    return 'PT' + Math.floor(100000 + Math.random() * 900000);
  };
  
  // Get all patients
  export const getAllPatients = async (sheetId, accessToken) => {
    try {
      const rows = await readSheetData(sheetId, accessToken);
      
      // Skip header row (index 0)
      const patients = [];
      for (let i = 1; i < rows.length; i++) {
        const patient = mapRowToPatient(rows[i]);
        if (patient) {
          patients.push(patient);
        }
      }
      
      return patients;
    } catch (error) {
      console.error('Error getting patients:', error);
      throw error;
    }
  };
  
  // Get patient by ID
  export const getPatientById = async (sheetId, accessToken, patientId) => {
    try {
      const result = await findRowByValue(sheetId, accessToken, patientId);
      return result ? mapRowToPatient(result.rowData) : null;
    } catch (error) {
      console.error(`Error getting patient with ID ${patientId}:`, error);
      throw error;
    }
  };
  
  // Add new patient
  export const addPatient = async (sheetId, accessToken, patient) => {
    try {
      // Ensure patient has an ID
      if (!patient.patientId) {
        patient.patientId = generatePatientId();
      }
      
      const rowData = mapPatientToRow(patient);
      await appendSheetRow(sheetId, accessToken, rowData);
      
      return patient;
    } catch (error) {
      console.error('Error adding patient:', error);
      throw error;
    }
  };
  
  // Update existing patient
  export const updatePatient = async (sheetId, accessToken, patient) => {
    try {
      // Find the row for this patient
      const result = await findRowByValue(sheetId, accessToken, patient.patientId);
      
      if (!result) {
        throw new Error(`Patient with ID ${patient.patientId} not found`);
      }
      
      const rowData = mapPatientToRow(patient);
      await updateSheetRow(sheetId, accessToken, result.rowIndex, rowData);
      
      return patient;
    } catch (error) {
      console.error(`Error updating patient with ID ${patient.patientId}:`, error);
      throw error;
    }
  };
  
  // Search patients by various criteria
  export const searchPatients = async (sheetId, accessToken, searchTerm) => {
    try {
      const allPatients = await getAllPatients(sheetId, accessToken);
      
      if (!searchTerm || searchTerm.trim() === '') {
        return allPatients;
      }
      
      const term = searchTerm.toLowerCase();
      return allPatients.filter(patient => 
        patient.firstName.toLowerCase().includes(term) ||
        patient.lastName.toLowerCase().includes(term) ||
        patient.phone.includes(term) ||
        patient.location.toLowerCase().includes(term) ||
        patient.address.toLowerCase().includes(term) ||
        (patient.firstName + ' ' + patient.lastName).toLowerCase().includes(term)
      );
    } catch (error) {
      console.error('Error searching patients:', error);
      throw error;
    }
  };
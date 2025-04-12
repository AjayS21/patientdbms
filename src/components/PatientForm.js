import React, { useState, useEffect } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Grid, 
  Typography, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  FormHelperText,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import { Add, Email, Save } from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';

const PatientForm = ({ sheetId, accessToken, isEdit, patient }) => {
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [formData, setFormData] = useState({
    patientId: '',
    firstName: '',
    lastName: '',
    location: '',
    phone: '',
    address: '',
    email: '',
    age: '',
    gender: '',
    physicianId: '',
    physicianFirstName: '',
    physicianLastName: '',
    physicianPhone: '',
    bill: '',
    prescription: '',
    dose: '',
    appointmentId: '',
    visitDate: null,
    nextVisit: null
  });

  useEffect(() => {
    if (isEdit && patient) {
      setFormData(patient);
    } else if (!isEdit) {
      // Generate a random patient ID for new patients
      generatePatientId();
      generateAppointmentId();
    }
  }, [isEdit, patient]);

  const generatePatientId = () => {
    const randomId = 'PT' + Math.floor(100000 + Math.random() * 900000);
    setFormData(prev => ({ ...prev, patientId: randomId }));
  };

  const generateAppointmentId = () => {
    const randomId = 'APT' + Math.floor(100000 + Math.random() * 900000);
    setFormData(prev => ({ ...prev, appointmentId: randomId }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (name) => (date) => {
    setFormData(prev => ({ ...prev, [name]: date }));
  };

  const validateForm = () => {
    // Basic validation for required fields
    if (!formData.firstName || !formData.lastName || !formData.phone) {
      setSnackbar({
        open: true,
        message: 'Please fill out all required fields',
        severity: 'error'
      });
      return false;
    }
    return true;
  };

  const formatDateForSheet = (date) => {
    try {
      if (!date || isNaN(new Date(date))) return '';
      const d = new Date(date);
      return d.toISOString().split('T')[0]; // outputs 'YYYY-MM-DD' (safest for Sheets)
    } catch {
      return '';
    }
  };

  const appendToSheet = async (sheetName, rowData) => {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetName}:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          majorDimension: 'ROWS',
          values: [rowData],
        }),
      }
    );
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Failed to write to sheet "${sheetName}": ${errText}`);
    }
  };

  const updateSheetRow = async (sheetName, matchColIndex, matchValue, rowData) => {
    const getUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetName}`;
    const getRes = await fetch(getUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
  
    if (!getRes.ok) throw new Error(`Failed to fetch ${sheetName} data`);
  
    const data = await getRes.json();
    const rows = data.values || [];
  
    const rowIndex = rows.findIndex(row => row[matchColIndex] === matchValue);
    if (rowIndex === -1) throw new Error(`No matching record found in ${sheetName}`);
  
    const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetName}!A${rowIndex + 1}?valueInputOption=USER_ENTERED`;
  
    const updateRes = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        majorDimension: 'ROWS',
        values: [rowData]
      }),
    });
  
    if (!updateRes.ok) {
      const errText = await updateRes.text();
      throw new Error(`Failed to update ${sheetName}: ${errText}`);
    }
  };
  
  
const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const {
        patientId, firstName, lastName, location, phone, email, address, age, gender,
        physicianId, physicianFirstName, physicianLastName, physicianPhone,
        bill, prescription, dose, appointmentId, visitDate, nextVisit
      } = formData;

      const formattedVisit = formatDateForSheet(visitDate);
      const formattedNextVisit = formatDateForSheet(nextVisit);

      if (isEdit) {
        const {
            patientId: oldPID, firstName: oldFirst, lastName: oldLast, address: oldAddress, location: oldLocation,
            email: oldEmail, phone: oldPhone, age: oldAge, gender: oldGender,
            physicianId: oldPhysID, physicianFirstName: oldPhysFirst, physicianLastName: oldPhysLast, physicianPhone: oldPhysPhone,
            appointmentId: oldAID, visitDate: oldVisitDate, nextVisit: oldNextVisit, bill: oldBill,
            prescription: oldRx, dose: oldDose
          } = patient;

        // 🧍 Patient data update check
      if (
        firstName !== oldFirst || lastName !== oldLast || address !== oldAddress || location !== oldLocation ||
        email !== oldEmail || phone !== oldPhone || age !== oldAge || gender !== oldGender
      ) {
        await updateSheetRow('patient', 0, patientId, [
          patientId, firstName, lastName, address, location, email, phone, age, gender
        ]);
      }
  
        // 🩺 Physician update check
      if (
        physicianId !== oldPhysID || physicianFirstName !== oldPhysFirst ||
        physicianLastName !== oldPhysLast || physicianPhone !== oldPhysPhone
      ) {
        await updateSheetRow('physician', 0, physicianId, [
          physicianId, physicianFirstName, physicianLastName, physicianPhone
        ]);
      }
  
        // 📅 Appointment update check
      if (
        appointmentId !== oldAID || visitDate !== oldVisitDate || nextVisit !== oldNextVisit || bill !== oldBill
      ) {
        await updateSheetRow('appointment', 0, appointmentId, [
          appointmentId, patientId, physicianId, formattedVisit, formattedNextVisit, bill
        ]);
      }

      // 💊 Prescription update check
      if (prescription !== oldRx || dose !== oldDose) {
        await updateSheetRow('prescribes', 1, patientId, [
          physicianId, patientId, prescription, dose, bill
        ]);
      }
      } else {
        // ➕ Add new

      // Write to `patient` sheet
      await appendToSheet('patient', [
        patientId, firstName, lastName, address, location,  email, phone, age, gender
      ]);

      // Write to `physician` sheet
      await appendToSheet('physician', [
        physicianId, physicianFirstName, physicianLastName, physicianPhone
      ]);

      // Write to `appointment` sheet
      await appendToSheet('appointment', [appointmentId,
        patientId, physicianId,
        formatDateForSheet(visitDate),
        formatDateForSheet(nextVisit),
        bill
      ]);

      // Write to `prescribes` sheet
      await appendToSheet('prescribes', [physicianId,
        patientId, prescription, dose, bill
      ]);
    }

      setSnackbar({
        open: true,
        message: isEdit ? 'Patient updated successfully' : 'Patient added successfully',
        severity: 'success'
      });

      // Reset form
      setFormData({
        patientId: '',
        firstName: '',
        lastName: '',
        location: '',
        phone: '',
        address: '',
        email: '',
        age: '',
        gender: '',
        physicianId: '',
        physicianFirstName: '',
        physicianLastName: '',
        physicianPhone: '',
        bill: '',
        prescription: '',
        dose: '',
        appointmentId: '',
        visitDate: null,
        nextVisit: null
      });

      generatePatientId();
      generateAppointmentId();
    } catch (error) {
      console.error('Error saving patient data:', error);
      setSnackbar({
        open: true,
        message: `Error: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <Typography variant="h5" gutterBottom>
        {isEdit ? 'Edit Patient' : 'Add New Patient'}
      </Typography>
      
      <Grid container spacing={3}>
        {/* Patient ID - Auto-generated and read-only */}
        <Grid item xs={12} sm={6}>
          <TextField
            name="patientId"
            label="Patient ID"
            value={formData.patientId}
            fullWidth
            disabled
            variant="outlined"
            helperText="Auto-generated"
          />
        </Grid>
        
        {/* Patient Name - First and Last Name */}
        <Grid item xs={12} sm={6}>
          <TextField
            required
            name="firstName"
            label="First Name"
            value={formData.firstName}
            onChange={handleChange}
            fullWidth
            variant="outlined"
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            required
            name="lastName"
            label="Last Name"
            value={formData.lastName}
            onChange={handleChange}
            fullWidth
            variant="outlined"
          />
        </Grid>
        
        {/* Location */}
        <Grid item xs={12} sm={6}>
          <TextField
            name="location"
            label="Location"
            value={formData.location}
            onChange={handleChange}
            fullWidth
            variant="outlined"
          />
        </Grid>
        {/* Email */}
        <Grid item xs={12} sm={6}>
          <TextField
            name="email"
            label="Email"
            value={formData.email}
            onChange={handleChange}
            fullWidth
            variant="outlined"
          />
        </Grid>
        
        {/* Phone */}
        <Grid item xs={12} sm={6}>
          <TextField
            required
            name="phone"
            label="Phone"
            value={formData.phone}
            onChange={handleChange}
            fullWidth
            variant="outlined"
          />
        </Grid>
        
        {/* Address */}
        <Grid item xs={12} sm={6}>
          <TextField
            name="address"
            label="Address"
            value={formData.address}
            onChange={handleChange}
            fullWidth
            variant="outlined"
            multiline
            rows={2}
          />
        </Grid>
        
        {/* Age */}
        <Grid item xs={12} sm={3}>
          <TextField
            name="age"
            label="Age"
            type="number"
            value={formData.age}
            onChange={handleChange}
            fullWidth
            variant="outlined"
            InputProps={{ inputProps: { min: 0, max: 120 } }}
          />
        </Grid>
        
        {/* Gender */}
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth variant="outlined">
            <InputLabel id="gender-label">Gender</InputLabel>
            <Select
              labelId="gender-label"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              label="Gender"
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              <MenuItem value="Male">Male</MenuItem>
              <MenuItem value="Female">Female</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        {/* Physician Info */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            Physician Information
          </Typography>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            name="physicianId"
            label="Physician ID"
            value={formData.physicianId}
            onChange={handleChange}
            fullWidth
            variant="outlined"
          />
        </Grid>
        
        <Grid item xs={12} sm={3}>
          <TextField
            name="physicianFirstName"
            label="Physician First Name"
            value={formData.physicianFirstName}
            onChange={handleChange}
            fullWidth
            variant="outlined"
          />
        </Grid>
        
        <Grid item xs={12} sm={3}>
          <TextField
            name="physicianLastName"
            label="Physician Last Name"
            value={formData.physicianLastName}
            onChange={handleChange}
            fullWidth
            variant="outlined"
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            name="physicianPhone"
            label="Physician Phone"
            value={formData.physicianPhone}
            onChange={handleChange}
            fullWidth
            variant="outlined"
          />
        </Grid>
        
        {/* Visit Details */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            Visit Details
          </Typography>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            name="bill"
            label="Bill Amount"
            value={formData.bill}
            onChange={handleChange}
            fullWidth
            variant="outlined"
            type="number"
            InputProps={{ inputProps: { min: 0 } }}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            name="prescription"
            label="Prescription"
            value={formData.prescription}
            onChange={handleChange}
            fullWidth
            variant="outlined"
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            name="dose"
            label="Dose"
            value={formData.dose}
            onChange={handleChange}
            fullWidth
            variant="outlined"
          />
        </Grid>
        
        <Grid item xs={12} sm={3}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Visit Date"
              value={formData.visitDate}
              onChange={handleDateChange('visitDate')}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </LocalizationProvider>
        </Grid>
        
        <Grid item xs={12} sm={3}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Next Visit"
              value={formData.nextVisit}
              onChange={handleDateChange('nextVisit')}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </LocalizationProvider>
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          startIcon={isEdit ? <Save /> : <Add />}
          disabled={loading}
          sx={{ ml: 1 }}
        >
          {loading ? (
            <CircularProgress size={24} />
          ) : isEdit ? (
            'Update Patient'
          ) : (
            'Add Patient'
          )}
        </Button>
      </Box>
      
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PatientForm;
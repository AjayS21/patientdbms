import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  InputAdornment,
  CircularProgress,
  Snackbar,
  Alert,
  TablePagination
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Edit as EditIcon, 
  Visibility as ViewIcon
} from '@mui/icons-material';

const PatientSearch = ({ sheetId, accessToken, onEditPatient }) => {
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Fetch all patients on component mount
  useEffect(() => {
    fetchPatients();
  }, [sheetId, accessToken]);

  const fetchAppointmentsSheetData = async () => {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/appointment`,
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );
  
    if (!response.ok) throw new Error('Failed to fetch appointment data');
    const sheet = await response.json();
    const rows = sheet.values || [];
  
    const map = {};
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      map[row[1]] = {
        visitDate: row[3] || '',
        nextVisit: row[4] || '',
        bill: row[5] || ''
      };
    }
  
    return map;
  };

  const fetchPhysiciansSheetData = async () => {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/physician`,
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );
  
    if (!response.ok) throw new Error('Failed to fetch physician data');
    const sheet = await response.json();
    const rows = sheet.values || [];
    console.log("row", rows)
  
    const map = {};
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length < 4) continue;
      const [id, firstName, lastName, phone] = row;
      if (!id || !firstName || !lastName) continue;
      map[id] = {
        physicianFirstName: firstName,
        physicianLastName: lastName,
        physicianPhone: phone || ''
      };
    }
  
    return map;
  };

  
  const fetchPatients = async () => {
    setLoading(true);
    try {
        // Fetch patient sheet
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/patient`,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch data from Google Sheet');
      }

      const data = await response.json();
      const rows = data.values || [];
      
      // Assuming the first row contains headers
      const headers = rows[0] || [];
      const patientData = [];

      const appointmentMap = await fetchAppointmentsSheetData();
      const physicianMap = await fetchPhysiciansSheetData();
      
      // Map sheet data to our patient objects
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length === 0) continue; // Skip empty rows
        const patientId = row[0];
        const physicianId = row[8] || '';
        const appointment = appointmentMap[patientId] || {};
        const physician = physicianMap[physicianId] || {};
        console.log(physician)
        
        const patient = {
          patientId,
          firstName: row[1] || '',
          lastName: row[2] || '',
          location: row[3] || '',
          phone: row[4] || '',
          address: row[5] || '',
          age: row[6] || '',
          gender: row[7] || '',
          physicianId,
          physicianFirstName: physician.physicianFirstName,
          physicianLastName: physician.physicianLastName,
          physicianPhone: physician.physicianPhone,
          visitDate: appointment.visitDate ? new Date(appointment.visitDate) : null,
          nextVisit: appointment.nextVisit ? new Date(appointment.nextVisit) : null,
          bill: appointment.bill || ''
        };
        
        patientData.push(patient);
      }
      
      setPatients(patientData);
      setFilteredPatients(patientData);
      
      if (patientData.length === 0) {
        setSnackbar({
          open: true,
          message: 'No patient records found in the sheet',
          severity: 'info'
        });
      }
      
    } catch (error) {
      console.error('Error fetching patients:', error);
      setSnackbar({
        open: true,
        message: `Error: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setFilteredPatients(patients);
      return;
    }
    
    const searchTermLower = searchTerm.toLowerCase();
    const filtered = patients.filter(patient => 
      patient.firstName.toLowerCase().includes(searchTermLower) ||
      patient.lastName.toLowerCase().includes(searchTermLower) ||
      patient.phone.includes(searchTerm) ||
      patient.location.toLowerCase().includes(searchTermLower) ||
      patient.address.toLowerCase().includes(searchTermLower) ||
      (patient.firstName + ' ' + patient.lastName).toLowerCase().includes(searchTermLower)
    );
    
    setFilteredPatients(filtered);
    setPage(0); // Reset to first page when searching
    
    if (filtered.length === 0) {
      setSnackbar({
        open: true,
        message: 'No patients found matching your search criteria',
        severity: 'info'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h5" gutterBottom>
        Search Patients
      </Typography>
      
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <TextField
          fullWidth
          variant="outlined"
          label="Search Patients"
          placeholder="Enter name, phone, location, or address"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={handleSearch}>
                  <SearchIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        
        <Button
          variant="contained"
          startIcon={<SearchIcon />}
          onClick={handleSearch}
          sx={{ ml: 2, height: 56 }}
        >
          Search
        </Button>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="patient table">
            <TableHead>
              <TableRow>
                <TableCell>Patient ID</TableCell>
                <TableCell>Patient Name</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Age</TableCell>
                <TableCell>Gender</TableCell>
                {/* <TableCell>Physician</TableCell> */}
                <TableCell>Last Visit</TableCell>
                <TableCell>Next Visit</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPatients
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((patient) => (
                  <TableRow key={patient.patientId}>
                    <TableCell component="th" scope="row">
                      {patient.patientId}
                    </TableCell>
                    <TableCell>{`${patient.firstName} ${patient.lastName}`}</TableCell>
                    <TableCell>{patient.location}</TableCell>
                    <TableCell>{patient.phone}</TableCell>
                    <TableCell>{patient.age}</TableCell>
                    <TableCell>{patient.gender}</TableCell>
                    {/* <TableCell>{`${patient.physicianFirstName} ${patient.physicianLastName}`}</TableCell> */}
                    <TableCell>{formatDate(patient.visitDate)}</TableCell>
                    <TableCell>{formatDate(patient.nextVisit)}</TableCell>
                    <TableCell>
                      <IconButton 
                        color="primary" 
                        onClick={() => onEditPatient(patient)}
                        title="Edit Patient"
                      >
                        <EditIcon />
                      </IconButton>
                      {/* <IconButton 
                        color="info"
                        title="View Details" 
                      >
                        <ViewIcon />
                      </IconButton> */}
                    </TableCell>
                  </TableRow>
                ))}
              {filteredPatients.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    No patients found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredPatients.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </TableContainer>
      )}
      
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

export default PatientSearch;
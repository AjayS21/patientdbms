import React, { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Container, Paper, Tabs, Tab, Box } from '@mui/material';
import { GoogleOAuthProvider } from '@react-oauth/google';

// Components
import DriveSelector from './components/DriveSelector';
import PatientForm from './components/PatientForm';
import PatientSearch from './components/PatientSearch';
import Header from './components/Header';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

// Replace with your Google Client ID
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

function App() {
  const [tabValue, setTabValue] = useState(0);
  const [sheetId, setSheetId] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [accessToken, setAccessToken] = useState('');
  const [patientToEdit, setPatientToEdit] = useState(null);

  const handleSheetSelection = (selectedSheetId, token) => {
    setSheetId(selectedSheetId);
    setAccessToken(token);
    setIsConnected(true);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    // Reset patient to edit when changing tabs
    if (newValue !== 2) {
      setPatientToEdit(null);
    }
  };

  const handleEditPatient = (patient) => {
    setPatientToEdit(patient);
    setTabValue(1); // Switch to the Edit tab
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Header />
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs value={tabValue} onChange={handleTabChange}>
                <Tab label="Add Patient" />
                <Tab label="Edit Patient" disabled={!isConnected} />
                <Tab label="Search Patient" disabled={!isConnected} />
              </Tabs>
            </Box>

            {!isConnected && (
              <Box sx={{ p: 2 }}>
                <DriveSelector onSheetSelected={handleSheetSelection} />
              </Box>
            )}

            {isConnected && tabValue === 0 && (
              <PatientForm 
                sheetId={sheetId} 
                accessToken={accessToken} 
                isEdit={false}
              />
            )}

            {isConnected && tabValue === 1 && (
              <PatientForm 
                sheetId={sheetId} 
                accessToken={accessToken} 
                isEdit={true}
                patient={patientToEdit}
              />
            )}

            {isConnected && tabValue === 2 && (
              <PatientSearch 
                sheetId={sheetId} 
                accessToken={accessToken}
                onEditPatient={handleEditPatient}
              />
            )}
          </Paper>
        </Container>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  CircularProgress, 
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
// import { GoogleLogin } from '@react-oauth/google';
import { Description, InsertDriveFile } from '@mui/icons-material';
import { gapi } from 'gapi-script';

const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/spreadsheets';

const DriveSelector = ({ onSheetSelected }) => {
  const [loading, setLoading] = useState(false);
  const [accessToken, setAccessToken] = useState('');
  const [files, setFiles] = useState([]);
  const [open, setOpen] = useState(false);

  // Initialize Google API client
  useEffect(() => {
    const start = () => {
      gapi.client.init({
        clientId: CLIENT_ID,
        scope: SCOPES,
      });
    };
    gapi.load('client:auth2', start);
  }, []);

  useEffect(() => {
    const initAuth = () => {
      gapi.load('client:auth2', () => {
        gapi.auth2.init({
          client_id: CLIENT_ID,
          scope: SCOPES
        }).then(() => {
          const authInstance = gapi.auth2.getAuthInstance();
          if (authInstance.isSignedIn.get()) {
            const user = authInstance.currentUser.get();
            const token = user.getAuthResponse().access_token;
  
            // Optionally store it
            localStorage.setItem('accessToken', token);
  
            // Send to App via prop or context
            setAccessToken(token); // Replace this with your prop/state
          }
        });
      });
    };
  
    initAuth();
  }, []);


//   const handleLoginSuccess = (response) => {
//     // Get the access token from the response
//     console.log("response", response)
//     setAccessToken(response.access_token || response.credential);
//   };
  const handleLoginSuccess = async () => {
    try {
        const auth2 = gapi.auth2.getAuthInstance();
        const user = await auth2.signIn();
        const token = user.getAuthResponse().access_token;
        console.log("after login Access token:", token);
        localStorage.setItem('accessToken', token);
        setAccessToken(token);
    } catch (error) {
        console.error('Google sign-in error:', error);
        alert('Login failed. Please try again.');
    }
  };

  const handleOpenFilePicker = async () => {
    setLoading(true);
    console.log("accessToken", accessToken)
    try {
      // Call the Google Drive API to list spreadsheets
      const response = await fetch(
        'https://www.googleapis.com/drive/v3/files?q=mimeType="application/vnd.google-apps.spreadsheet"&fields=files(id,name)',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch files');
      }

      const data = await response.json();
      setFiles(data.files);
      setOpen(true);
    } catch (error) {
      console.error('Error fetching files:', error);
      alert('Error fetching files from Google Drive. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (fileId) => {
    onSheetSelected(fileId, accessToken);
    setOpen(false);
  };

  return (
    <Box sx={{ textAlign: 'center', p: 3 }}>
      <Paper elevation={2} sx={{ p: 4, maxWidth: 500, mx: 'auto' }}>
        <Typography variant="h5" gutterBottom>
          Connect to Google Sheets
        </Typography>
        <Typography variant="body1" paragraph>
          To begin, please connect to your Google account and select a spreadsheet to use as your patient database.
        </Typography>

        {!accessToken ? (
          <Box sx={{ mt: 2 }}>
            {/* <GoogleLogin
              onSuccess={handleLoginSuccess}
              onError={() => console.log('Login Failed')}
              scope="https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/spreadsheets"
              theme="filled_blue"
              text="continue_with"
              shape="rectangular"
              size="large"
            /> */}
             <Button variant="contained" onClick={handleLoginSuccess}>
            Sign in with Google
            </Button>
          </Box>
        ) : (
          <Button
            variant="contained"
            color="primary"
            onClick={handleOpenFilePicker}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <Description />}
            sx={{ mt: 2 }}
          >
            {loading ? 'Loading...' : 'Select Google Sheet'}
          </Button>
        )}
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Select a Google Sheet</DialogTitle>
        <DialogContent>
          <List>
            {files.map((file) => (
              <ListItem 
                button 
                key={file.id} 
                onClick={() => handleFileSelect(file.id)}
                sx={{ 
                  border: '1px solid #e0e0e0', 
                  borderRadius: 1, 
                  mb: 1,
                  '&:hover': { bgcolor: '#f5f5f5' } 
                }}
              >
                <ListItemIcon>
                  <InsertDriveFile color="success" />
                </ListItemIcon>
                <ListItemText primary={file.name} />
              </ListItem>
            ))}
            {files.length === 0 && (
              <Typography color="text.secondary">
                No spreadsheets found in your Google Drive
              </Typography>
            )}
          </List>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default DriveSelector;
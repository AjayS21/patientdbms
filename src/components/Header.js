import React from 'react';
import { AppBar, Toolbar, Typography, Box } from '@mui/material';
import { LocalHospital } from '@mui/icons-material';

const Header = () => {
  return (
    <AppBar position="static">
      <Toolbar>
        <LocalHospital sx={{ mr: 2 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Patient Database Management
        </Typography>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Fab,
  Tabs,
  Tab,
  AppBar,
  Toolbar,
  Button,
  IconButton
} from '@mui/material';
import {
  Add as AddIcon,
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
  Dashboard as DashboardIcon,
  ExitToApp as LogoutIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import EmployeeList from './EmployeeList';
import AddEmployeeModal from './AddEmployeeModal';
import DashboardStats from './DashboardStats';

const AdminDashboard = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const { user, logout } = useAuth();

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleAddEmployee = () => {
    setOpenAddModal(true);
  };

  const handleCloseModal = () => {
    setOpenAddModal(false);
  };

  const handleEmployeeAdded = () => {
    setRefreshTrigger(prev => prev + 1);
    setOpenAddModal(false);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Admin Dashboard - Welcome, {user?.name || 'Administrator'}
          </Typography>
          <Button color="inherit" onClick={handleLogout} startIcon={<LogoutIcon />}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 3, mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab
              icon={<DashboardIcon />}
              label="Dashboard"
              iconPosition="start"
            />
            <Tab
              icon={<PeopleIcon />}
              label="All Employees"
              iconPosition="start"
            />
          </Tabs>

          <Button
            variant="contained"
            color="primary"
            startIcon={<PersonAddIcon />}
            onClick={handleAddEmployee}
            sx={{ ml: 2 }}
          >
            Add User
          </Button>
        </Box>

        {currentTab === 0 && (
          <DashboardStats refreshTrigger={refreshTrigger} />
        )}

        {currentTab === 1 && (
          <EmployeeList 
            refreshTrigger={refreshTrigger}
            onEmployeeUpdate={() => setRefreshTrigger(prev => prev + 1)}
          />
        )}


        <AddEmployeeModal
          open={openAddModal}
          onClose={handleCloseModal}
          onEmployeeAdded={handleEmployeeAdded}
        />
      </Container>
    </Box>
  );
};

export default AdminDashboard;

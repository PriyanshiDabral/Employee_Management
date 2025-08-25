import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  TextField,
  Button,
  AppBar,
  Toolbar,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  Work as WorkIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  Edit as EditIcon,
  ExitToApp as LogoutIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useForm, Controller } from 'react-hook-form';
import axios from 'axios';

const EmployeeDashboard = () => {
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  
  const { user, logout } = useAuth();
  const { control, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    fetchEmployeeData();
  }, []);

  const fetchEmployeeData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/employees');
      if (response.data.length > 0) {
        setEmployee(response.data[0]);
        reset({
          name: response.data[0].name,
          phone: response.data[0].phone || '',
          address: response.data[0].address || ''
        });
      }
      setError('');
    } catch (error) {
      setError('Failed to fetch employee data');
      console.error('Error fetching employee:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (data) => {
    try {
      setUpdateLoading(true);
      await axios.put(`/api/employees/${employee.id}`, data);
      setEmployee({ ...employee, ...data });
      setEditMode(false);
    } catch (error) {
      setError('Failed to update profile');
    } finally {
      setUpdateLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!employee) {
    return (
      <Container>
        <Alert severity="error">
          Employee profile not found. Please contact your administrator.
        </Alert>
      </Container>
    );
  }

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Employee Portal - Welcome, {employee.name}
          </Typography>
          <Button color="inherit" onClick={logout} startIcon={<LogoutIcon />}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Profile Header */}
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item>
              <Avatar
                sx={{ 
                  width: 80, 
                  height: 80, 
                  bgcolor: 'primary.main',
                  fontSize: '2rem'
                }}
              >
                {employee.name?.charAt(0)}
              </Avatar>
            </Grid>
            <Grid item xs>
              <Typography variant="h4" gutterBottom>
                {employee.name}
              </Typography>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                {employee.role}
              </Typography>
              <Chip 
                label={employee.status} 
                color={getStatusColor(employee.status)}
                sx={{ textTransform: 'capitalize' }}
              />
            </Grid>
            <Grid item>
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => setEditMode(true)}
              >
                Edit Profile
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Employee Information */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  Contact Information
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <EmailIcon sx={{ mr: 1, color: 'action.active' }} />
                    <Typography variant="body2" color="textSecondary">
                      Email
                    </Typography>
                  </Box>
                  <Typography variant="body1">{employee.email}</Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <PhoneIcon sx={{ mr: 1, color: 'action.active' }} />
                    <Typography variant="body2" color="textSecondary">
                      Phone
                    </Typography>
                  </Box>
                  <Typography variant="body1">
                    {employee.phone || 'Not provided'}
                  </Typography>
                </Box>

                <Box>
                  <Box display="flex" alignItems="center" mb={1}>
                    <LocationIcon sx={{ mr: 1, color: 'action.active' }} />
                    <Typography variant="body2" color="textSecondary">
                      Address
                    </Typography>
                  </Box>
                  <Typography variant="body1">
                    {employee.address || 'Not provided'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  Work Information
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <WorkIcon sx={{ mr: 1, color: 'action.active' }} />
                    <Typography variant="body2" color="textSecondary">
                      Position
                    </Typography>
                  </Box>
                  <Typography variant="body1">{employee.role}</Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <BusinessIcon sx={{ mr: 1, color: 'action.active' }} />
                    <Typography variant="body2" color="textSecondary">
                      Department
                    </Typography>
                  </Box>
                  <Typography variant="body1">{employee.department}</Typography>
                </Box>

                <Box>
                  <Box display="flex" alignItems="center" mb={1}>
                    <CalendarIcon sx={{ mr: 1, color: 'action.active' }} />
                    <Typography variant="body2" color="textSecondary">
                      Hire Date
                    </Typography>
                  </Box>
                  <Typography variant="body1">
                    {formatDate(employee.hire_date)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Edit Profile Modal */}
        <Dialog open={editMode} onClose={() => setEditMode(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Edit Profile</DialogTitle>
          <form onSubmit={handleSubmit(handleUpdate)}>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Controller
                    name="name"
                    control={control}
                    rules={{ required: 'Name is required' }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Full Name"
                        error={!!errors.name}
                        helperText={errors.name?.message}
                        disabled={updateLoading}
                      />
                    )}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Controller
                    name="phone"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Phone Number"
                        disabled={updateLoading}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Controller
                    name="address"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Address"
                        multiline
                        rows={3}
                        disabled={updateLoading}
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            
            <DialogActions>
              <Button onClick={() => setEditMode(false)} disabled={updateLoading}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="contained"
                disabled={updateLoading}
              >
                {updateLoading ? <CircularProgress size={20} /> : 'Update'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Container>
    </Box>
  );
};

export default EmployeeDashboard;

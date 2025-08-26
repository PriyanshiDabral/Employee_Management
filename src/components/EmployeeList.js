import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Alert,
  CircularProgress,
  Grid,
  TableSortLabel
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import axios from 'axios';
import EditEmployeeModal from './EditEmployeeModal';

const EmployeeList = ({ refreshTrigger, onEmployeeUpdate }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Search and filter states
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('ASC');
  
  // Modal states
  const [editEmployee, setEditEmployee] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  // Unique filter options
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);

  // Predefined status options
  const statusOptions = ['active', 'inactive', 'pending'];

  useEffect(() => {
    fetchEmployees();
  }, [refreshTrigger, search, departmentFilter, roleFilter, statusFilter, sortBy, sortOrder]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [search, departmentFilter, roleFilter, statusFilter]);

  useEffect(() => {
    // Fetch all employees without filters to populate filter options
    fetchFilterOptions();
  }, [refreshTrigger]);

  const fetchFilterOptions = async () => {
    try {
      // Fetch all employees to get complete list of departments and roles
      const response = await axios.get('/api/employees');
      const allEmployees = response.data;

      // Extract unique departments and roles for filters
      const uniqueDepts = [...new Set(allEmployees.map(emp => emp.department))].filter(Boolean).sort();
      const uniqueRoles = [...new Set(allEmployees.map(emp => emp.role))].filter(Boolean).sort();
      setDepartments(uniqueDepts);
      setRoles(uniqueRoles);
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (search) params.append('search', search);
      if (departmentFilter) params.append('department', departmentFilter);
      if (roleFilter) params.append('role', roleFilter);
      if (statusFilter) params.append('status', statusFilter);
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);

      const apiUrl = `/api/employees?${params}`;
      console.log('API Request:', apiUrl);
      console.log('Filters:', { search, departmentFilter, roleFilter, statusFilter, sortBy, sortOrder });

      const response = await axios.get(apiUrl);
      console.log('API Response:', response.data);
      setEmployees(response.data);

      // Reset page to 0 when new data comes in and current page is beyond available pages
      const totalPages = Math.ceil(response.data.length / rowsPerPage);
      if (page >= totalPages && totalPages > 0) {
        setPage(0);
      }

      setError('');
    } catch (error) {
      setError('Failed to fetch employees');
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (column) => {
    const isAsc = sortBy === column && sortOrder === 'ASC';
    setSortOrder(isAsc ? 'DESC' : 'ASC');
    setSortBy(column);
  };

  const handleEdit = (employee) => {
    setEditEmployee(employee);
  };

  const handleDelete = async (employeeId) => {
    try {
      await axios.delete(`/api/employees/${employeeId}`);
      setDeleteConfirm(null);
      onEmployeeUpdate();
    } catch (error) {
      setError('Failed to delete employee');
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setDepartmentFilter('');
    setRoleFilter('');
    setStatusFilter('');
    setSortBy('name');
    setSortOrder('ASC');
    setPage(0); // Reset pagination when clearing filters
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const filteredEmployees = employees.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Employee Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Active Filters Display */}
      {(search || departmentFilter || roleFilter || statusFilter) && (
        <Paper elevation={1} sx={{ p: 2, mb: 2, bgcolor: 'primary.50' }}>
          <Typography variant="body2" color="primary" sx={{ mb: 1 }}>
            <strong>Active Filters:</strong>
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            {search && (
              <Chip
                label={`Search: "${search}"`}
                onDelete={() => setSearch('')}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
            {departmentFilter && (
              <Chip
                label={`Department: ${departmentFilter}`}
                onDelete={() => setDepartmentFilter('')}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
            {roleFilter && (
              <Chip
                label={`Role: ${roleFilter}`}
                onDelete={() => setRoleFilter('')}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
            {statusFilter && (
              <Chip
                label={`Status: ${statusFilter}`}
                onDelete={() => setStatusFilter('')}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
            <Button
              variant="text"
              size="small"
              onClick={handleClearFilters}
              startIcon={<ClearIcon />}
            >
              Clear All
            </Button>
          </Box>
        </Paper>
      )}

      {/* Search and Filters */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Search employees"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Department</InputLabel>
              <Select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                label="Department"
              >
                <MenuItem value="">All</MenuItem>
                {departments.map(dept => (
                  <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                label="Role"
              >
                <MenuItem value="">All</MenuItem>
                {roles.map(role => (
                  <MenuItem key={role} value={role}>{role}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="">All</MenuItem>
                {statusOptions.map(status => (
                  <MenuItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleClearFilters}
              startIcon={<ClearIcon />}
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Employee Table */}
      <TableContainer component={Paper} elevation={3}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'name'}
                  direction={sortBy === 'name' ? sortOrder.toLowerCase() : 'asc'}
                  onClick={() => handleSort('name')}
                >
                  Name
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'email'}
                  direction={sortBy === 'email' ? sortOrder.toLowerCase() : 'asc'}
                  onClick={() => handleSort('email')}
                >
                  Email
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'role'}
                  direction={sortBy === 'role' ? sortOrder.toLowerCase() : 'asc'}
                  onClick={() => handleSort('role')}
                >
                  Role
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'department'}
                  direction={sortBy === 'department' ? sortOrder.toLowerCase() : 'asc'}
                  onClick={() => handleSort('department')}
                >
                  Department
                </TableSortLabel>
              </TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredEmployees.length > 0 ? (
              filteredEmployees.map((employee) => (
                <TableRow key={employee.id} hover>
                  <TableCell>{employee.name}</TableCell>
                  <TableCell>{employee.email}</TableCell>
                  <TableCell>{employee.role}</TableCell>
                  <TableCell>{employee.department}</TableCell>
                  <TableCell>
                    <Chip
                      label={employee.status}
                      color={getStatusColor(employee.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      color="primary"
                      onClick={() => handleEdit(employee)}
                      size="small"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => setDeleteConfirm(employee)}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  <Typography variant="body1" color="textSecondary">
                    {(search || departmentFilter || roleFilter || statusFilter)
                      ? 'No employees found matching the selected filters. Try clearing some filters.'
                      : 'No employees found.'
                    }
                  </Typography>
                  {(search || departmentFilter || roleFilter || statusFilter) && (
                    <Button
                      variant="outlined"
                      onClick={handleClearFilters}
                      sx={{ mt: 1 }}
                      size="small"
                    >
                      Clear All Filters
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={employees.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(event, newPage) => setPage(newPage)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
        />
      </TableContainer>

      {/* Edit Employee Modal */}
      {editEmployee && (
        <EditEmployeeModal
          employee={editEmployee}
          open={!!editEmployee}
          onClose={() => setEditEmployee(null)}
          onEmployeeUpdated={() => {
            setEditEmployee(null);
            onEmployeeUpdate();
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {deleteConfirm?.name}? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button
            onClick={() => handleDelete(deleteConfirm.id)}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmployeeList;

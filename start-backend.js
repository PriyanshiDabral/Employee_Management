const { spawn } = require('child_process');
const path = require('path');

// Start the backend server
const backendProcess = spawn('npm', ['start'], {
  cwd: path.join(__dirname, 'server'),
  stdio: 'inherit'
});

backendProcess.on('error', (err) => {
  console.error('Failed to start backend server:', err);
});

backendProcess.on('close', (code) => {
  console.log(`Backend server process exited with code ${code}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down backend server...');
  backendProcess.kill();
  process.exit(0);
});

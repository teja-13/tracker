require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const driveRoutes = require('./routes/driveRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Database Status Endpoint
app.get('/api/health', (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  res.json({
    status: 'ok',
    database: isConnected ? 'MongoDB Atlas Connected' : 'In-Memory Fallback Active (Configure MONGODB_URI in .env for Atlas)',
    dbState: mongoose.connection.readyState
  });
});

// API Routes
app.use('/api/drives', driveRoutes);

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// MongoDB Atlas Connection
const mongoURI = process.env.MONGODB_URI;

if (mongoURI && !mongoURI.includes('your_username')) {
  mongoose.connect(mongoURI)
  .then(() => {
    console.log(' Successfully connected to MongoDB Atlas');
  })
  .catch((err) => {
    console.error(' MongoDB Atlas Connection Warning:', err.message);
    console.log(' Server will operate using fallback database until MongoDB Atlas connection is established.');
  });
} else {
  console.log('ℹ MONGODB_URI not configured yet. Server operating with fallback database.');
  console.log('  To connect to MongoDB Atlas, update your connection string in .env file.');
}

// Start Express Server
app.listen(PORT, () => {
  console.log(`🚀 Placement Drive Tracker server running at http://localhost:${PORT}`);
});

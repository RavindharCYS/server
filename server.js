// server/server.js
require('dotenv').config(); // Load environment variables from .env file FIRST

const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose'); // Import mongoose directly for graceful shutdown
const connectDB = require('./config/db');

// Import route handlers
const bookingRoutes = require('./routes/bookingRoutes');
const contactRoutes = require('./routes/contactRoutes');
const careerRoutes = require('./routes/careerRoutes');
const newsletterRoutes = require('./routes/newsletterRoutes');

// Connect to Database
connectDB();

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middleware ---

// CORS Configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://tzurglobalreact.web.app' // Your deployed frontend URL
  // Add 'https://www.tzurglobalreact.web.app' if you also use a www version
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `CORS Error: The policy does not allow access from the specified Origin: ${origin}`;
      console.error(msg); // Log blocked origins for debugging
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
}));

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Static File Serving for Uploads (Needs Revision for Production on Ephemeral Filesystems) ---
// IMPORTANT FOR RAILWAY & SIMILAR PLATFORMS:
// The local file system on platforms like Railway is often ephemeral.
// Files saved here (like resumes via multer's diskStorage) WILL BE LOST on redeploys or service restarts.
// For production, you MUST switch to a cloud storage solution (e.g., AWS S3, Google Cloud Storage, Cloudinary)
// for handling user file uploads.
// Once cloud storage is implemented, this local static serving for '/uploads/resumes' will likely be removed
// or be used only for other genuinely static assets not related to user uploads.
const localUploadsPath = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(localUploadsPath));


// --- Health Check Endpoint ---
// Essential for platforms like Railway to monitor application health.
app.get('/health', (req, res) => {
  const healthStatus = {
    status: 'UP',
    timestamp: new Date().toISOString(),
    dbReadyState: mongoose.connection.readyState, // (0: disconn, 1: conn, 2: connecting, 3: disc)
    dbStatus: mongoose.STATES[mongoose.connection.readyState] || 'UNKNOWN'
  };

  if (mongoose.connection.readyState === 1) { // 1 means connected
    res.status(200).json(healthStatus);
  } else {
    healthStatus.status = 'DEGRADED';
    healthStatus.message = 'Database connection issue.';
    res.status(503).json(healthStatus); // 503 Service Unavailable
  }
});


// --- API Routes ---
app.get('/api/test', (req, res) => {
  res.json({ message: 'Tzur Global Backend API is live and responsive!' });
});

app.use('/api/bookings', bookingRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/careers', careerRoutes);
app.use('/api/newsletter', newsletterRoutes);

// --- Catch-all for 404 Not Found ---
app.use((req, res, next) => {
  res.status(404).json({ message: `Resource not found at ${req.method} ${req.originalUrl}` });
});

// --- Global Error Handler ---
app.use((err, req, res, next) => {
  console.error('GLOBAL SERVER ERROR:', err.stack || err.message || err);

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'File is too large. Max size is 5MB.' });
  }
  if (err.code === 'INVALID_FILE_TYPE' && err.message && err.message.startsWith('Invalid file type')) {
    return res.status(400).json({ message: err.message });
  }
  if (err.name === 'MulterError') {
    return res.status(400).json({ message: `File upload error: ${err.message}` });
  }

  res.status(err.status || 500).json({
    message: err.message || 'An unexpected server error occurred.',
    error: process.env.NODE_ENV === 'development' ? { name: err.name, message: err.message, stack: err.stack } : {},
  });
});

// --- Start the Server ---
const server = app.listen(PORT, () => {
  console.log(`Backend server for Tzur Global is listening on http://localhost:${PORT} (actual port on Railway will be dynamic)`);
  console.log(`NODE_ENV is: ${process.env.NODE_ENV || 'not set'}`);
  // The check for uploads directory creation is in uploadMiddleware.js
  // Log related to serving local uploads:
  console.log(`Serving files from local '/uploads' directory: ${localUploadsPath}. (NOTE: Review for production on ephemeral filesystems like Railway)`);
});

// --- Graceful Shutdown Logic ---
const gracefulShutdown = (signal) => {
  console.log(`\nReceived ${signal}. Initiating graceful shutdown.`);
  server.close((err) => {
    if (err) {
      console.error('Error during HTTP server close:', err);
      // process.exit(1); // Optionally exit if server close fails critically
    }
    console.log('HTTP server closed.');
    mongoose.connection.close(false).then(() => {
      console.log('MongoDB connection closed successfully.');
      process.exit(0); // Exit after DB connection is closed
    }).catch(dbErr => {
      console.error('Error closing MongoDB connection:', dbErr);
      process.exit(1); // Exit with error if DB close fails
    });
  });

  // Force shutdown if graceful shutdown takes too long
  setTimeout(() => {
    console.error('Graceful shutdown timed out. Forcefully shutting down.');
    process.exit(1);
  }, 10000); // 10-second timeout
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM')); // Standard signal for termination
process.on('SIGINT', () => gracefulShutdown('SIGINT'));   // For Ctrl+C in terminal
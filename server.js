// server/server.js
require('dotenv').config(); // Load environment variables from .env file FIRST

const express = require('express');
const cors = require('cors');
const path = require('path'); // Required for serving static files if you store resumes locally
const mongoose = require('mongoose'); // Import mongoose directly for graceful shutdown
const connectDB = require('./config/db'); // Import DB connection

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
  'http://localhost:5173', // Vite dev server (default)
  'http://127.0.0.1:5173',
  // Add your production frontend URL here when you deploy
  // e.g., 'https://your-frontend-domain.com'
  // If your Railway frontend is, for example, my-awesome-app.up.railway.app
  // 'https://my-awesome-app.up.railway.app'
];

// If your backend is on Railway, you might need to allow its own generated URL
// if some internal health checks or services need to access it.
// This is less common for typical browser CORS, but good to keep in mind.
// const railwayAppUrl = process.env.RAILWAY_STATIC_URL; // Railway might provide this
// if (railwayAppUrl && !allowedOrigins.includes(railwayAppUrl)) {
//   allowedOrigins.push(railwayAppUrl);
// }


app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests, or server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
}));

// Body Parsers
app.use(express.json()); // To parse JSON request bodies (Content-Type: application/json)
app.use(express.urlencoded({ extended: true })); // To parse URL-encoded request bodies (Content-Type: application/x-www-form-urlencoded)

// Serve static files (e.g., uploaded resumes if stored locally)
// The 'uploads' directory is where multer will save files.
// This makes files in `server/uploads/resumes` accessible via `/uploads/resumes/filename.pdf`
// IMPORTANT: For platforms like Railway, local file storage is ephemeral.
// You MUST switch to a cloud storage solution (S3, Google Cloud Storage) for production.
// This static serving will then likely be removed or adapted.
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// --- Health Check Endpoint ---
// Railway (and other PaaS) will use this to determine if your app is healthy.
app.get('/health', (req, res) => {
  // You can add more sophisticated checks here if needed (e.g., DB connectivity)
  // For now, a simple 200 OK is often sufficient to start.
  const healthStatus = {
    status: 'UP',
    timestamp: new Date().toISOString(),
    // Check mongoose connection state (0: disconnected, 1: connected, 2: connecting, 3: disconnecting)
    dbReadyState: mongoose.connection.readyState
  };

  if (mongoose.connection.readyState === 1) { // 1 means connected
    res.status(200).json(healthStatus);
  } else {
    // If DB is not connected, signal service unavailable but don't crash
    // Railway might still mark this as unhealthy depending on its criteria.
    // Consider what status code is appropriate for your health check definition.
    // 503 Service Unavailable is a common choice if a critical dependency is down.
    healthStatus.status = 'DEGRADED';
    healthStatus.message = 'Database connection not ready.';
    res.status(503).json(healthStatus);
  }
});


// --- API Routes ---

// A simple test route to check if the API is up
app.get('/api/test', (req, res) => {
  res.json({ message: 'Tzur Global Backend API is live and responsive!' });
});

// Mount the specific route handlers
app.use('/api/bookings', bookingRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/careers', careerRoutes);
app.use('/api/newsletter', newsletterRoutes);

// --- Catch-all for 404 Not Found (if no routes matched) ---
app.use((req, res, next) => {
  res.status(404).json({ message: `Resource not found at ${req.originalUrl}` });
});

// --- Global Error Handler ---
// This should be the LAST piece of middleware
app.use((err, req, res, next) => {
  console.error('SERVER ERROR:', err.stack || err.message || err);

  // Multer error handling (optional: for more specific multer error messages)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'File is too large. Max size is 5MB.' });
  }
  // Check for custom error code set in uploadMiddleware
  if (err.code === 'INVALID_FILE_TYPE' && err.message && err.message.startsWith('Invalid file type')) {
    return res.status(400).json({ message: err.message });
  }
  // Handle other multer errors more generically if needed
  if (err.name === 'MulterError') {
    return res.status(400).json({ message: `File upload error: ${err.message}`});
  }


  res.status(err.status || 500).json({
    message: err.message || 'An unexpected server error occurred.',
    // In development, you might want to send more error details
    error: process.env.NODE_ENV === 'development' ? { name: err.name, message: err.message, stack: err.stack } : {},
  });
});

// --- Start the Server ---
const server = app.listen(PORT, () => {
  console.log(`Backend server for Tzur Global is listening on http://localhost:${PORT}`);
  console.log(`NODE_ENV is: ${process.env.NODE_ENV || 'not set (defaults to development in error handler)'}`);
  console.log(`Attempting to serve static files from: ${path.join(__dirname, 'uploads')}`);
  // The following line for uploads directory check is in uploadMiddleware.js
  // and will run when that module is first required.
});

// --- Graceful Shutdown ---
const gracefulShutdown = (signal) => {
  console.log(`\nReceived ${signal}. Closing HTTP server.`);
  server.close(() => {
    console.log('HTTP server closed.');
    // Close MongoDB connection
    mongoose.connection.close(false).then(() => { // `false` for Mongoose 6+ to not force close
      console.log('MongoDB connection closed successfully.');
      process.exit(0);
    }).catch(err => {
      console.error('Error closing MongoDB connection:', err);
      process.exit(1);
    });
  });

  // If server hasn't finished in reasonable time, force shut
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000); // 10 seconds
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM')); // Standard signal for termination (e.g., from Railway, Docker, PM2)
process.on('SIGINT', () => gracefulShutdown('SIGINT'));   // For Ctrl+C in terminal
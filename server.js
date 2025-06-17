// server/server.js
require('dotenv').config(); // Load environment variables from .env file FIRST

const express = require('express');
const cors = require('cors');
const path = require('path'); // Required for serving static files if you store resumes locally
const connectDB = require('./config/db'); // Import DB connection

// Import route handlers
const bookingRoutes = require('./routes/bookingRoutes');
const contactRoutes = require('./routes/contactRoutes');
const careerRoutes = require('./routes/careerRoutes'); // Added
const newsletterRoutes = require('./routes/newsletterRoutes'); // Added

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
  // 'https://www.your-tzur-global-domain.com'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
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
// Adjust the path as per your multer configuration in uploadMiddleware.js
// IMPORTANT: For production, consider using a dedicated file storage service (S3, Google Cloud Storage)
// and serving files from there, or ensuring this path is secured.
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// --- API Routes ---

// A simple test route to check if the API is up
app.get('/api/test', (req, res) => {
  res.json({ message: 'Tzur Global Backend API is live and responsive!' });
});

// Mount the specific route handlers
app.use('/api/bookings', bookingRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/careers', careerRoutes);       // Added
app.use('/api/newsletter', newsletterRoutes); // Added

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
  if (err.message && err.message.startsWith('Invalid file type')) {
    return res.status(400).json({ message: err.message });
  }


  res.status(err.status || 500).json({
    message: err.message || 'An unexpected server error occurred.',
    // In development, you might want to send more error details
    error: process.env.NODE_ENV === 'development' ? err : {},
  });
});

// --- Start the Server ---
app.listen(PORT, () => {
  console.log(`Backend server for Tzur Global is listening on http://localhost:${PORT}`);
  console.log(`NODE_ENV is: ${process.env.NODE_ENV || 'not set (defaults to development in error handler)'}`);
  console.log(`Attempting to serve static files from: ${path.join(__dirname, 'uploads')}`);
});
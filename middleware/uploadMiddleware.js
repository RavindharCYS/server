// server/middleware/uploadMiddleware.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Define the directory path for uploads
// __dirname is the current directory (server/middleware)
// So, '../uploads/resumes' will go one level up to server/ then into uploads/resumes/
const uploadsDir = path.join(__dirname, '../uploads/resumes');

// Ensure uploads directory exists, create it if it doesn't
if (!fs.existsSync(uploadsDir)){
    console.log(`Uploads directory ${uploadsDir} does not exist. Creating it...`);
    fs.mkdirSync(uploadsDir, { recursive: true });
} else {
    console.log(`Uploads directory ${uploadsDir} already exists.`);
}


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir); // Save files to server/uploads/resumes
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Accept common document types
    if (file.mimetype === 'application/pdf' ||
        file.mimetype === 'application/msword' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        cb(null, true);
    } else {
        // Create a new error object for multer to catch
        const err = new Error('Invalid file type. Only PDF, DOC, and DOCX are allowed.');
        err.code = 'INVALID_FILE_TYPE'; // You can add custom error codes
        cb(err, false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 5 // 5MB limit
    },
    fileFilter: fileFilter
});

module.exports = upload;
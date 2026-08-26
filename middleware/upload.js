const multer = require('multer');
const cloudinary = require('../config/cloudinary');

// Use Memory Storage for Multer
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Helper function to process uploads to Cloudinary or convert to Data URI fallback
const processUploads = async (files) => {
  if (!files || files.length === 0) return [];

  const uploadPromises = files.map(file => {
    return new Promise((resolve, reject) => {
      // Check if Cloudinary is configured with valid credentials
      if (
        process.env.CLOUDINARY_CLOUD_NAME && 
        process.env.CLOUDINARY_CLOUD_NAME !== 'muqaddas_cloud' &&
        process.env.CLOUDINARY_API_KEY && 
        process.env.CLOUDINARY_API_KEY !== '123456789'
      ) {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'muqaddas-studio' },
          (error, result) => {
            if (error) return reject(error);
            resolve(result.secure_url);
          }
        );
        stream.end(file.buffer);
      } else {
        // Fallback to Data URI for seamless local testing
        const b64 = Buffer.from(file.buffer).toString('base64');
        const mimeType = file.mimetype;
        const dataUri = `data:${mimeType};base64,${b64}`;
        resolve(dataUri);
      }
    });
  });

  return Promise.all(uploadPromises);
};

module.exports = { upload, processUploads };

const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// 1. Configure Multer to store file in Memory (Buffer)
const multerStorage = multer.memoryStorage();

// 2. Filter: Allow only images
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload only images.'), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // Limit to 5MB
});

// Export the "Single File" uploader
exports.uploadEventBanner = upload.single('banner');

// 3. Image Processing Middleware (The Core Logic)
exports.resizeEventBanner = async (req, res, next) => {
  if (!req.file) return next();

  // Create filename: event-timestamp.jpeg
  const filename = `event-${Date.now()}.jpeg`;
  const outputPath = path.join('public/uploads/events', filename);

  // Ensure directory exists
  fs.mkdirSync('public/uploads/events', { recursive: true });

  // Process image using Sharp
  await sharp(req.file.buffer)
    .resize(1280, 720, { // Standard HD Banner size
      fit: 'cover',
      position: 'center'
    })
    .toFormat('jpeg')
    .jpeg({ quality: 90 }) // Compress to 90% quality
    .toFile(outputPath);

  // Attach the filename to req.body so the controller can save it to DB
  req.body.bannerUrl = `/uploads/events/${filename}`;

  next();
};
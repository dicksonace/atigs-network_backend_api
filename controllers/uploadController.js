const fs = require('fs');
const path = require('path');
const multer = require('multer');

const uploadsRoot = path.join(__dirname, '..', 'uploads');
const contentUploadsDir = path.join(uploadsRoot, 'content');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(contentUploadsDir, { recursive: true });
    cb(null, contentUploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safeExt = ext || '.jpg';
    cb(null, `content-${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error('Only JPG, PNG, WEBP, and GIF images are allowed'));
  }
  cb(null, true);
};

const uploadImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

exports.uploadContentImage = [
  uploadImage.single('image'),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file uploaded' });
    }

    const relativeUrl = `/api/uploads/content/${req.file.filename}`;
    return res.status(201).json({ imageUrl: relativeUrl });
  },
];


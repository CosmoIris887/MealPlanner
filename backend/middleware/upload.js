const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../uploads');
const tempZipDir = path.join(uploadDir, 'temp-zip');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(tempZipDir)) {
  fs.mkdirSync(tempZipDir, { recursive: true });
}

// Single image upload storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `food-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Format gambar tidak didukung. Hanya JPG, JPEG, PNG, dan WebP yang diizinkan.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: fileFilter
});

// ZIP dataset upload storage
const zipStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempZipDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `dataset-${uniqueSuffix}.zip`);
  }
});

const zipFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'application/zip',
    'application/x-zip-compressed',
    'application/x-zip',
    'multipart/x-zip',
    'application/octet-stream'
  ];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedMimeTypes.includes(file.mimetype) || ext === '.zip') {
    cb(null, true);
  } else {
    cb(new Error('Format berkas harus berupa arsip ZIP (.zip). Berkas lain tidak didukung.'), false);
  }
};

const multerZipInstance = multer({
  storage: zipStorage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit for dataset archives
  fileFilter: zipFileFilter
});

// Flexible middleware that accepts any field name ('datasetZip', 'zipFile', 'file')
upload.zipFlexible = (req, res, next) => {
  multerZipInstance.any()(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'Ukuran file ZIP melebihi batas maksimal yang diizinkan (500 MB).'
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || 'Gagal mengunggah file ZIP.'
      });
    }

    // Normalize req.file from req.files
    if (req.files && req.files.length > 0) {
      // Find matching zipFile or datasetZip first, else first file
      req.file = req.files.find((f) => f.fieldname === 'datasetZip' || f.fieldname === 'zipFile') || req.files[0];
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Tidak ada berkas ZIP yang diterima. Silakan pilih berkas dataset .zip.'
      });
    }

    next();
  });
};

upload.zip = multerZipInstance;

module.exports = upload;

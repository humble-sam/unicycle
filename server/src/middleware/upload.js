const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const sharp = require('sharp');
const { fileTypeFromFile } = require('file-type');

// Determine absolute base path for uploads
// __dirname is server/src/middleware, so we go up 3 levels to get to public_html
const UPLOADS_BASE_DIR = path.resolve(__dirname, '..', '..', '..', 'uploads');

// Ensure upload directories exist
const createUploadDirs = () => {
  const dirs = ['products', 'avatars'];
  dirs.forEach(subdir => {
    const fullPath = path.join(UPLOADS_BASE_DIR, subdir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  });
};

createUploadDirs();

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = req.baseUrl.includes('product') ? 'products' : 'avatars';
    cb(null, path.join(UPLOADS_BASE_DIR, type));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter with magic number validation
const fileFilter = async (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

  // Basic MIME type check
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'), false);
  }

  // Magic number validation will be done after file is written
  // We'll validate in the post-processing step
  cb(null, true);
};

// Multer config
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
    files: 5 // Max 5 files per upload
  }
});

// Post-process uploaded images: validate magic numbers, compress, and optimize
const processUploadedImages = async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next();
  }

  const maxWidth = parseInt(process.env.MAX_IMAGE_WIDTH) || 2000;
  const maxHeight = parseInt(process.env.MAX_IMAGE_HEIGHT) || 2000;
  const quality = parseInt(process.env.IMAGE_QUALITY) || 85;

  try {
    const processedFiles = [];

    for (const file of req.files) {
      const filePath = file.path;

      // Validate magic number (actual file type)
      const fileType = await fileTypeFromFile(filePath);
      if (!fileType || !['image/jpeg', 'image/png', 'image/webp'].includes(fileType.mime)) {
        // Delete invalid file
        fs.unlinkSync(filePath);
        throw new Error(`Invalid file type detected for ${file.originalname}. Only JPEG, PNG, and WebP are allowed.`);
      }

      // Get image metadata
      const metadata = await sharp(filePath).metadata();

      // Check dimensions
      if (metadata.width > maxWidth || metadata.height > maxHeight) {
        // Resize if too large
        await sharp(filePath)
          .resize(maxWidth, maxHeight, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .toFile(filePath + '.tmp');

        // Replace original with resized
        fs.renameSync(filePath + '.tmp', filePath);
      }

      // Optimize and compress image based on original format
      const tempPath = filePath + '.opt';
      let sharpInstance = sharp(filePath);

      // Apply format-specific optimization
      if (fileType.mime === 'image/jpeg') {
        sharpInstance = sharpInstance.jpeg({ quality: quality, mozjpeg: true });
      } else if (fileType.mime === 'image/png') {
        sharpInstance = sharpInstance.png({ quality: quality, compressionLevel: 9 });
      } else if (fileType.mime === 'image/webp') {
        sharpInstance = sharpInstance.webp({ quality: quality });
      }

      await sharpInstance.toFile(tempPath);
      // Replace original with optimized version
      fs.renameSync(tempPath, filePath);

      processedFiles.push(file);
    }

    req.files = processedFiles;
    next();
  } catch (error) {
    // Clean up any uploaded files on error
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    return res.status(400).json({ error: error.message || 'Failed to process images' });
  }
};

// Process single uploaded image (for avatars)
const processUploadedImage = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  const maxWidth = parseInt(process.env.MAX_IMAGE_WIDTH) || 2000;
  const maxHeight = parseInt(process.env.MAX_IMAGE_HEIGHT) || 2000;
  const quality = parseInt(process.env.IMAGE_QUALITY) || 85;

  try {
    const filePath = req.file.path;

    // Validate magic number (actual file type)
    const fileType = await fileTypeFromFile(filePath);
    if (!fileType || !['image/jpeg', 'image/png', 'image/webp'].includes(fileType.mime)) {
      // Delete invalid file
      fs.unlinkSync(filePath);
      throw new Error(`Invalid file type detected for ${req.file.originalname}. Only JPEG, PNG, and WebP are allowed.`);
    }

    // Get image metadata
    const metadata = await sharp(filePath).metadata();

    // Check dimensions
    if (metadata.width > maxWidth || metadata.height > maxHeight) {
      // Resize if too large
      await sharp(filePath)
        .resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .toFile(filePath + '.tmp');

      // Replace original with resized
      fs.renameSync(filePath + '.tmp', filePath);
    }

    // Optimize and compress image based on original format
    const tempPath = filePath + '.opt';
    let sharpInstance = sharp(filePath);

    // Apply format-specific optimization
    if (fileType.mime === 'image/jpeg') {
      sharpInstance = sharpInstance.jpeg({ quality: quality, mozjpeg: true });
    } else if (fileType.mime === 'image/png') {
      sharpInstance = sharpInstance.png({ quality: quality, compressionLevel: 9 });
    } else if (fileType.mime === 'image/webp') {
      sharpInstance = sharpInstance.webp({ quality: quality });
    }

    await sharpInstance.toFile(tempPath);
    // Replace original with optimized version
    fs.renameSync(tempPath, filePath);

    next();
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(400).json({ error: error.message || 'Failed to process image' });
  }
};

module.exports = { upload, processUploadedImages, processUploadedImage };

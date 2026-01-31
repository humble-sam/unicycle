const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const sharp = require('sharp');
const { fileTypeFromFile } = require('file-type');

// Determine absolute base path for uploads
// __dirname is server/src/middleware, so we go up 3 levels to get to public_html
const UPLOADS_BASE_DIR = path.resolve(__dirname, '..', '..', '..', 'uploads');

// Debug logging for upload path
console.log('[UPLOAD DEBUG] __dirname:', __dirname);
console.log('[UPLOAD DEBUG] UPLOADS_BASE_DIR:', UPLOADS_BASE_DIR);
console.log('[UPLOAD DEBUG] UPLOADS_BASE_DIR exists:', fs.existsSync(UPLOADS_BASE_DIR));

// Ensure upload directories exist
const createUploadDirs = () => {
  const dirs = ['products', 'avatars'];
  dirs.forEach(subdir => {
    const fullPath = path.join(UPLOADS_BASE_DIR, subdir);
    console.log('[UPLOAD DEBUG] Ensuring directory exists:', fullPath);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log('[UPLOAD DEBUG] Created directory:', fullPath);
    }
  });
};

createUploadDirs();

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = req.baseUrl.includes('product') ? 'products' : 'avatars';
    const destPath = path.join(UPLOADS_BASE_DIR, type);
    console.log('[UPLOAD DEBUG] Saving file to:', destPath);
    cb(null, destPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    console.log('[UPLOAD DEBUG] Generated filename:', uniqueName);
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
// If processing fails, keep original files instead of deleting them
const processUploadedImages = async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next();
  }

  const maxWidth = parseInt(process.env.MAX_IMAGE_WIDTH) || 2000;
  const maxHeight = parseInt(process.env.MAX_IMAGE_HEIGHT) || 2000;
  const quality = parseInt(process.env.IMAGE_QUALITY) || 85;

  const processedFiles = [];

  for (const file of req.files) {
    const filePath = file.path;
    console.log('[UPLOAD] Processing file:', filePath);

    try {
      // Validate magic number (actual file type)
      const fileType = await fileTypeFromFile(filePath);
      if (!fileType || !['image/jpeg', 'image/png', 'image/webp'].includes(fileType.mime)) {
        console.log('[UPLOAD] Invalid file type, deleting:', filePath);
        fs.unlinkSync(filePath);
        continue; // Skip this file but don't fail entire upload
      }

      // Try to process with sharp (optional - if it fails, keep original)
      try {
        // Get image metadata
        const metadata = await sharp(filePath).metadata();

        // Check dimensions
        if (metadata.width > maxWidth || metadata.height > maxHeight) {
          await sharp(filePath)
            .resize(maxWidth, maxHeight, {
              fit: 'inside',
              withoutEnlargement: true
            })
            .toFile(filePath + '.tmp');
          fs.renameSync(filePath + '.tmp', filePath);
          console.log('[UPLOAD] Resized image:', filePath);
        }

        // Optimize and compress image
        const tempPath = filePath + '.opt';
        let sharpInstance = sharp(filePath);

        if (fileType.mime === 'image/jpeg') {
          sharpInstance = sharpInstance.jpeg({ quality: quality, mozjpeg: true });
        } else if (fileType.mime === 'image/png') {
          sharpInstance = sharpInstance.png({ quality: quality, compressionLevel: 9 });
        } else if (fileType.mime === 'image/webp') {
          sharpInstance = sharpInstance.webp({ quality: quality });
        }

        await sharpInstance.toFile(tempPath);
        fs.renameSync(tempPath, filePath);
        console.log('[UPLOAD] Optimized image:', filePath);
      } catch (sharpError) {
        // Sharp processing failed - keep original file
        console.log('[UPLOAD] Sharp processing failed, keeping original:', sharpError.message);
        // Clean up any temp files
        if (fs.existsSync(filePath + '.tmp')) fs.unlinkSync(filePath + '.tmp');
        if (fs.existsSync(filePath + '.opt')) fs.unlinkSync(filePath + '.opt');
      }

      processedFiles.push(file);
      console.log('[UPLOAD] File processed successfully:', filePath);
    } catch (error) {
      console.error('[UPLOAD] Error processing file:', filePath, error.message);
      // Keep the file even if processing failed
      if (fs.existsSync(filePath)) {
        processedFiles.push(file);
        console.log('[UPLOAD] Keeping file despite error:', filePath);
      }
    }
  }

  if (processedFiles.length === 0) {
    return res.status(400).json({ error: 'No valid images uploaded' });
  }

  req.files = processedFiles;
  next();
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

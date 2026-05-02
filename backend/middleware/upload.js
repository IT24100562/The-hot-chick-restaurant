const multer = require('multer');
const path = require('path');
const fs = require('fs');

const BASE_UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
const IMAGE_EXTS = ['.jpeg', '.jpg', '.png', '.webp'];
const PDF_MIME_TYPES = ['application/pdf'];
const PDF_EXTS = ['.pdf'];

const ensureDir = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

ensureDir(BASE_UPLOAD_DIR);

const createUploader = ({ folder, allowedMimeTypes, allowedExtensions, maxFileSizeMB = 5 }) => {
    const uploadDir = path.join(BASE_UPLOAD_DIR, folder);
    ensureDir(uploadDir);

    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, uploadDir);
        },
        filename: function (req, file, cb) {
            const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
            cb(null, `${uniqueSuffix}${path.extname(file.originalname).toLowerCase()}`);
        },
    });

    const fileFilter = (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const isValidExt = allowedExtensions.includes(ext);
        const isValidMime = allowedMimeTypes.includes(file.mimetype);

        if (isValidExt && isValidMime) {
            return cb(null, true);
        }

        cb(new Error('Invalid file type. Allowed types: ' + allowedExtensions.join(', ')));
    };

    return multer({
        storage,
        limits: { fileSize: maxFileSizeMB * 1024 * 1024 },
        fileFilter,
    });
};

const uploadImage = (folder) =>
    createUploader({ folder, allowedMimeTypes: IMAGE_MIME_TYPES, allowedExtensions: IMAGE_EXTS, maxFileSizeMB: 5 });

const uploadPdf = (folder) =>
    createUploader({ folder, allowedMimeTypes: PDF_MIME_TYPES, allowedExtensions: PDF_EXTS, maxFileSizeMB: 5 });

module.exports = {
    createUploader,
    uploadImage,
    uploadPdf,
};

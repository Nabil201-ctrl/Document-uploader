const multer = require("multer");

const cloudinaryUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const isImage = file.mimetype.startsWith("image/");
    if (!isImage) {
      return cb(new Error("Only image files (jpg, jpeg, png, gif) are allowed"), false);
    }
    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

module.exports = { cloudinaryUpload };
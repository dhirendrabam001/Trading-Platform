const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination(req, res, cb) {
    cb(null, "./upload");
  },

  filename(req, res, cb) {
    cb(null, new Date.now() + path.extname(file.originalname));
  },
});

const fileFilter = (req, res, cb) => {
  const allowedType = [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "image/webp",
    "application/pdf",
  ];

  if (allowedType.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, PNG, WEBP and PDF allowed"), false);
  }
};
module.exports = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
});

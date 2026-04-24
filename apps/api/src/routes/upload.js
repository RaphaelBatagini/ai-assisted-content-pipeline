const router = require('express').Router();
const multer = require('multer');
const auth = require('../middlewares/auth');
const { uploadFile } = require('../services/s3Service');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter(req, file, cb) {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
});

// POST /api/upload
router.post('/', auth, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }
    const { siteId } = req.body;
    const { url } = await uploadFile({
      buffer: req.file.buffer,
      mimetype: req.file.mimetype,
      userId: req.user.userId,
      siteId: siteId || 'general',
    });
    res.json({ url });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

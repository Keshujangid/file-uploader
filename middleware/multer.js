const multer = require('multer');

function fileSizeLimit(req, res, next) {
  const contentLength = req.headers['content-length'];

  if (contentLength && parseInt(contentLength) > 1024 * 1024 * 5) {
    console.log('File size exceeds limit of 5MB ' , contentLength);
    req.flash('error', 'File size exceeds limit of 5MB ');
    return res.redirect('/');
  }
  
  next();
}

const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5 // Limit file size to 5MB
  }
});

module.exports = { upload, fileSizeLimit };
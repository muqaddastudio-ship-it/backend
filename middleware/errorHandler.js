const errorHandler = (err, req, res, next) => {
  console.error('[API Error Detail]:', err);

  let statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : (err.statusCode || err.status || 500);
  let message = err.message || 'Internal Server Error';

  // Handle Multer Errors (e.g. LIMIT_FIELD_VALUE, LIMIT_FILE_SIZE)
  if (err.name === 'MulterError' || err.code?.startsWith('LIMIT_')) {
    statusCode = 400;
    message = `Upload Error: ${err.message}`;
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = 'Resource not found';
  }

  // Handle Mongoose Duplicate Key Error
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `A record with this ${field} already exists`;
  }

  // Handle Mongoose ValidationError
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors || {}).map(val => val.message).join(', ');
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};

module.exports = errorHandler;

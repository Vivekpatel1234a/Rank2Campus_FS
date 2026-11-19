export function notFound(req, res, _next) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}
export function errorHandler(err, _req, res, _next) {
  console.error(err);
  if (err.name === 'ValidationError') return res.status(400).json({ success: false, message: err.message });
  if (err.code === 11000) return res.status(409).json({ success: false, message: 'A record with this value already exists.' });
  if (err.name === 'CastError') return res.status(400).json({ success: false, message: 'Invalid resource ID.' });
  const status = err.statusCode || 500;
  res.status(status).json({ success: false, message: status === 500 ? 'Internal server error' : err.message });
}

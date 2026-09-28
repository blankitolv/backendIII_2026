export function errorMiddleware(err, req, res, _next) {
  const code = err.code ?? 'INTERNAL';
  const status = err.status ?? 500;
  const message = status === 500 ? 'Internal server error' : (err.message ?? code);
  if (req.logger) {
    req.logger.error(message, { code });
  }
  res.status(status).json({ status: 'error', error: code, message });
}

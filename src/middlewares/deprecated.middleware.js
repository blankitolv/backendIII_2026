export function deprecated({ sunset = null } = {}) {
  return (req, res, next) => {
    const activeLogger = req.logger;
    const label = `Endpoint deprecado: ${req.method} ${req.originalUrl}`;
    if (activeLogger) {
      activeLogger.warn(label, { requestId: req.requestId, userId: req.user?.id });
    }
    res.setHeader('Deprecation', 'true');
    if (sunset) {
      res.setHeader('Sunset', sunset);
    }
    next();
  };
}

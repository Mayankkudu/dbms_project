const { verifyToken } = require('../services/auth.service');

/**
 * Verifies the JWT on every protected request and attaches the decoded
 * payload as req.user. This is the ONLY source of truth for who the caller
 * is — the frontend role is never trusted.
 */
function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  try {
    req.user = verifyToken(token);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Restricts a route to one or more roles. Must run AFTER authenticate().
 * Example: router.post('/vitals', authenticate, authorize('NURSE','DOCTOR'), ctrl.createVital)
 *
 * This is the actual backend enforcement Section 8 requires — a PATIENT
 * token hitting a DOCTOR-only route gets a 403 here regardless of what
 * the frontend does or doesn't render.
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: `Role '${req.user.role}' is not permitted to access this resource` });
    }
    next();
  };
}

module.exports = { authenticate, authorize };

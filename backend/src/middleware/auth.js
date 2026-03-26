const jwt = require('jsonwebtoken');

/**
 * Verifies JWT token and attaches decoded user to req.user
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, role, name }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Restricts route to admin (professor) role only
 */
const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

/**
 * Restricts route to student role only
 */
const studentOnly = (req, res, next) => {
  if (req.user?.role !== 'student') {
    return res.status(403).json({ error: 'Student access required' });
  }
  next();
};

module.exports = { authenticate, adminOnly, studentOnly };

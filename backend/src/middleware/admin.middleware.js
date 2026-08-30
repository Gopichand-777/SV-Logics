// Requires the user to be an admin (super_admin or content_manager)
export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.tableSource !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  if (req.user.role !== 'super_admin' && req.user.role !== 'content_manager') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
};

export const requireSuperAdmin = (req, res, next) => {
  if (!req.user || req.user.tableSource !== 'admin' || req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Super admin access required.' });
  }
  next();
};

export const requireContentManager = (req, res, next) => {
  if (!req.user || req.user.tableSource !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  const allowed = ['super_admin', 'content_manager'];
  if (!allowed.includes(req.user.role)) {
    return res.status(403).json({ error: 'Content manager access required.' });
  }
  next();
};

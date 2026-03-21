function superAdminAuth(req, res, next) {
  const password = req.headers['x-admin-password'];
  if (password !== process.env.SUPER_ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized — Super Admin only' });
  }
  req.adminRole = 'superadmin';
  next();
}

function adminAuth(req, res, next) {
  const password = req.headers['x-admin-password'];
  if (
    password !== process.env.ADMIN_PASSWORD &&
    password !== process.env.SUPER_ADMIN_PASSWORD
  ) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.adminRole =
    password === process.env.SUPER_ADMIN_PASSWORD ? 'superadmin' : 'admin';
  next();
}

module.exports = { superAdminAuth, adminAuth };
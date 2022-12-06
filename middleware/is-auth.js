exports.adminAuth = (req, res, next) => {
  if (!req.session.isAdminLoggedIn) {
    return res.redirect("/admin-login");
  }
  next();
};

exports.userAuth = (req, res, next) => {
  if (!req.session.isLoggedIn) {
    return res.redirect("/login-now");
  }
  next();
};

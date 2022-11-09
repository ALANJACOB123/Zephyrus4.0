const crypto = require("crypto");
// const GoogleStrategy = require('passport-google-oauth20').Strategy

const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const ejs = require("ejs");
const { validationResult } = require('express-validator/check');

const AdminUser = require("../models/admin-user");
const User = require("../models/user");

let transporter = nodemailer.createTransport({
  host: "smtp.zoho.in",
  secure: true,
  port: 465,
  auth: {
    user: "alanjacob433@zohomail.in",
    pass: "7AUisiV3cNXg"
  },
});

exports.getAdminLogin = (req, res, next) => {
  let message = req.flash('error');
  let emailsent = req.flash('emailsent')
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  if (emailsent.length > 0) {
    emailsent = emailsent[0];
  } else {
    emailsent = null;
  }
  res.render("admin/admin-login", {
    pageTitle: "Admin-Login",
    path: "/admin",
    errorMessage: message,
    emailsent: emailsent,
    oldInput: {
      email: '',
      password: ''
    },
    validationErrors: []
  });
};

exports.postAdminLogin = (req, res, next) => {
  let email = req.body.email;
  if(email === '@'){
    email = '';
  }
  const password = req.body.password;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render('admin/admin-login', {
      path: '/admin-login',
      pageTitle: 'Admin-Login',
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password
      },
      validationErrors: errors.array()
    });
  }
  AdminUser.findOne({ email: email })
    .then((user) => {
      if (!user) {
        return res.status(422).render('admin/admin-login', {
          path: '/admin-login',
          pageTitle: 'Admin-Login',
          errorMessage: 'Invalid email or password.',
          oldInput: {
            email: email,
            password: password
          },
          validationErrors: []
        });
      }

      bcrypt
        .compare(password, user.password)
        .then((doMatch) => {
          if (doMatch) {
            req.session.isAdminLoggedIn = true;
            req.session.user = user;
            return req.session.save((err) => {
              return res.redirect("/admin/events");
            });
          }
          return res.status(422).render('admin/admin-login', {
            path: '/admin-login',
            pageTitle: 'Admin-Login',
            errorMessage: 'Invalid email or password.',
            oldInput: {
              email: email,
              password: password
            },
            validationErrors: []
          });
        })
        .catch(err => {
          res.redirect('/admin-login');
        });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};


exports.postAdminLogout = (req, res, next) => {
  req.session.destroy((err) => {
    res.redirect("/admin-login");
  });
};

exports.getAdminReset = (req, res, next) => {
  res.render("admin/admin-reset", {
    path: "/admin-reset",
    pageTitle: "Reset Password",
    errorMessage: '',
    oldInput: {
      email: '',
    },
    validationErrors: [],
  });
};

exports.postAdminReset = (req, res, next) => {
  let email = req.body.email;
  if(email === '@'){
    email = '';
  }
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render('admin/admin-reset', {
      path: '/admin-reset',
      pageTitle: 'Reset Password',
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
      },
      validationErrors: errors.array()
    });
  }
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      return res.redirect("/admin-reset");
    }
    const token = buffer.toString("hex");
    AdminUser.findOne({ email: req.body.email })
      .then((user) => {
        if (!user) {
          return res.status(422).render('admin/admin-reset', {
            path: '/admin-reset',
            pageTitle: 'Reset Password',
            errorMessage: 'No account with that email found.',
            oldInput: {
              email: req.body.email,
            },
            validationErrors: []
          });
        }
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000;
        return user.save();
      })
      .then( async (result) => {
        req.flash('emailsent', 'Please check your Email for password reset link');
        res.redirect("/admin-login");
        const data = await ejs.renderFile( "./templates/password-reset.ejs", { name: 'Admin', token : token });
        return transporter.sendMail({
          to: req.body.email,
          from: "alanjacob433@gmail.com",
          subject: "Password reset",
          html: data,
        });
      })
      .catch((err) => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);

      });
  });
};

exports.getAdminNewPassword = (req, res, next) => {
  let message = req.flash('success');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  const token = req.params.token;
  if(message)
  {
    res.render("admin/admin-new-password", {
      path: "/admin-new-password",
      pageTitle: "New Password",
      userId: '',
      passwordToken: token,
      errorMessage: null,
      success: message,
      oldInput: {
        password: '',
        confirmPassword: ''
      },
      windowclose: true,
      validationErrors: [],
    });
  }
  else
  {
    AdminUser.findOne({
      resetToken: token,
      resetTokenExpiration: { $gt: Date.now() },
    })
      .then((user) => {
        res.render("admin/admin-new-password", {
          path: "/admin-new-password",
          pageTitle: "New Password",
          userId: user._id.toString(),
          passwordToken: token,
          errorMessage: message,
          success: message,
          oldInput: {
            password: '',
            confirmPassword: ''
          },
          validationErrors: [],
          windowclose: false,
        });
      })
      .catch((err) => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
  }
  
};

exports.postAdminNewPassword = (req, res, next) => {
  const newPassword = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
  const token = passwordToken;
  let resetUser;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render('admin/admin-new-password', {
      path: '/admin-new-password',
      pageTitle: 'New Password',
      errorMessage: errors.array()[0].msg,
      userId: userId,
      passwordToken: passwordToken,
      success: null,
      oldInput: {
        password: newPassword,
        confirmPassword: confirmPassword
      },
      validationErrors: errors.array(),
      windowclose: false,
    });
  }
  AdminUser.findOne({
    resetToken: passwordToken,
    resetTokenExpiration: { $gt: Date.now() },
    _id: userId,
  })
    .then((user) => {
      resetUser = user;
      return bcrypt.hash(newPassword, 12);
    })
    .then((hashedPassword) => {
      resetUser.password = hashedPassword;
      resetUser.resetToken = undefined;
      resetUser.resetTokenExpiration = undefined;
      return resetUser.save();
    })
    .then((result) => {
      req.flash('success', 'Your pasword has been successfully Reset. This window will be automatically closed')
      res.redirect(`/admin-reset/${token}`);
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getLogin = (req, res, next) => {
  let message = req.flash('error');
  let emailsent = req.flash('emailsent');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  if (emailsent.length > 0) {
    emailsent = emailsent[0];
  } else {
    emailsent = null;
  }
  res.render("auth/login", {
    path: "/login",
    pageTitle: "Login",
    errorMessage: message,
    emailsent: emailsent,
    oldInput: {
      email: '',
      password: '',
      confirmPassword: ''
    },
    validationErrors: [],
  });
};

exports.getSignup = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("auth/signup", {
    path: "/signup",
    pageTitle: "Signup",
    errorMessage: message,
    oldInput: {
      email: '',
      password: '',
      confirmPassword: ''
    },
    validationErrors: [],
  });
};

exports.postLogin = (req, res, next) => {
  let email = req.body.email;
  if(email === '@'){
    email = '';
  }
  const password = req.body.password;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render('auth/login', {
      path: '/login',
      pageTitle: 'Login',
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password
      },
      validationErrors: errors.array()
    });
  }
  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        return res.status(422).render('auth/login', {
          path: '/login',
          pageTitle: 'Login',
          errorMessage: 'Invalid email or password.',
          oldInput: {
            email: email,
            password: password
          },
          validationErrors: []
        });
      }
      bcrypt
        .compare(password, user.password)
        .then((doMatch) => {
          if (doMatch) {
            if (user.spotAccess) {
              req.session.spotAccess = true;
              req.session.save();
            }
            req.session.isLoggedIn = true;
            isAdminLoggedIn = false;
            req.session.user = user;
            return req.session.save((err) => {
              if(user.Name === undefined 
                && user.CollegeName === undefined 
                && user.Dept === undefined 
                && user.Address === undefined 
                && user.State === undefined 
                && user.PhoneNo === undefined
              )
              {
                res.redirect("/user-profile");

              }
              else
              {
                res.redirect("/");
              }
            });
          }
          return res.status(422).render('auth/login', {
            path: '/login',
            pageTitle: 'Login',
            errorMessage: 'Invalid email or password.',
            oldInput: {
              email: email,
              password: password
            },
            validationErrors: []
          });
        })
        .catch(err => {
          res.redirect('/login');
        });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postGoogleLogin = (req, res, next) => {
  if (req.user) {
    User.findOne({ googleId: req.user.googleId })
      .then((user) => {
        if (!user) {
          return res.status(422).render('auth/login', {
            path: '/login',
            pageTitle: 'Login',
            errorMessage: 'Invalid email or password.',
          });
        }
        else {
          req.session.isLoggedIn = true;
          req.session.user = user;
          return req.session.save((err) => {
            res.redirect("/user-profile");
          });
        }
      })
      .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
  }
  else {
    res.redirect('/auth/google');
  }
};


exports.postSignup = (req, res, next) => {
  let email = req.body.email;
  if(email === '@'){
    email = '';
  }
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render('auth/signup', {
      path: '/signup',
      pageTitle: 'Signup',
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password,
        confirmPassword: req.body.confirmPassword
      },
      validationErrors: errors.array()
    });
  }
  bcrypt
    .hash(password, 12)
    .then(hashedPassword => {
      const user = new User({
        email: email,
        password: hashedPassword,
        registration: { events: [] }
      });
      return user.save();
    })
    .then(result => {
      res.redirect('/login');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    res.redirect("/");
  });
};

exports.getReset = (req, res, next) => {
  res.render("auth/reset", {
    path: "/reset",
    pageTitle: "Reset Password",
    spotAccess: false,
    errorMessage: '',
    oldInput: {
      email: '',
    },
    validationErrors: [],
  });
};

exports.postReset = (req, res, next) => {
  let email = req.body.email;
  if(email === '@'){
    email = '';
  }
  let userName = 0;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render('auth/reset', {
      path: '/reset',
      pageTitle: 'Reset Password',
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
      },
      validationErrors: errors.array()
    });
  }
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      return res.redirect("/reset");
    }
    const token = buffer.toString("hex");
    User.findOne({ email: req.body.email })
      .then((user) => {
        if (!user) {
          return res.status(422).render('auth/reset', {
            path: '/reset',
            pageTitle: 'Reset Password',
            errorMessage: 'No account with that email found.',
            oldInput: {
              email: req.body.email,
            },
            validationErrors: []
          });
        }
        userName = user.Name;
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000;
        return user.save();
      })
      .then( async (result) => {
        req.flash('emailsent', 'Please check your Email for password reset link')
        res.redirect("/login");
        const data = await ejs.renderFile( "./templates/password-reset.ejs", { name: userName, token : token });
        return transporter.sendMail({
          to: req.body.email,
          from: "alanjacob433@gmail.com",
          subject: "Password reset",
          html: data,
        });
      })
      .catch((err) => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
  });
};

exports.getNewPassword = (req, res, next) => {
  let message = req.flash('success');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  const token = req.params.token;
  if(message)
  {
    res.render("admin/admin-new-password", {
      path: "/admin-new-password",
      pageTitle: "New Password",
      userId: '',
      passwordToken: token,
      errorMessage: null,
      success: message,
      oldInput: {
        password: '',
        confirmPassword: ''
      },
      windowclose: true,
      validationErrors: [],
    });
  }
  else
  {
    User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
    .then((user) => {
      res.render("auth/new-password", {
        path: "/new-password",
        pageTitle: "New Password",
        userId: user._id.toString(),
        errorMessage: message,
          success: message,
          oldInput: {
            password: '',
            confirmPassword: ''
          },
        passwordToken: token,
        windowclose: false,
        validationErrors: [],
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
  }
  
};

exports.postNewPassword = (req, res, next) => {
  const newPassword = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
  const token = passwordToken;
  let resetUser;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render('auth/new-password', {
      path: '/new-password',
      pageTitle: 'New Password',
      errorMessage: errors.array()[0].msg,
      userId: userId,
      passwordToken: passwordToken,
      success: null,
      oldInput: {
        password: newPassword,
        confirmPassword: confirmPassword
      },
      validationErrors: errors.array(),
      windowclose: false,
    });
  }
  User.findOne({
    resetToken: passwordToken,
    resetTokenExpiration: { $gt: Date.now() },
    _id: userId,
  })
    .then((user) => {
      resetUser = user;
      return bcrypt.hash(newPassword, 12);
    })
    .then((hashedPassword) => {
      resetUser.password = hashedPassword;
      resetUser.resetToken = undefined;
      resetUser.resetTokenExpiration = undefined;
      return resetUser.save();
    })
    .then((result) => {
      req.flash('success', 'Your pasword has been successfully Reset. This window will be automatically closed')
      res.redirect(`reset/${token}`);
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};


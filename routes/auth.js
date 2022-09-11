const express = require("express");
const passport = require('passport')
const { check, body } = require('express-validator/check');

const authController = require("../controllers/auth");
const isAuth = require("../middleware/is-auth");
const User = require('../models/user');

const router = express.Router();

router.get("/admin-login", authController.getAdminLogin);

router.post("/admin-login", [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email address.')
    .normalizeEmail(),
  body('password', 'Password has to be valid.')
    .isLength({ min: 5 })
    .isAlphanumeric()
    .trim()
], authController.postAdminLogin);

router.post("/admin-logout", isAuth.adminAuth, authController.postAdminLogout);

router.get("/admin-reset", authController.getAdminReset);

router.post("/admin-reset",[
  check('email')
    .isEmail()
    .withMessage('Please Enter a valid Email')
    .normalizeEmail(),
], authController.postAdminReset);

router.get("/admin-reset/:token", authController.getAdminNewPassword);

router.post("/admin-new-password", authController.postAdminNewPassword);

router.get("/login", authController.getLogin);

router.get("/signup", authController.getSignup);

router.post("/login", [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email address.')
    .normalizeEmail(),
  body('password', 'Password has to be valid.')
    .isLength({ min: 5 })
    .isAlphanumeric()
    .trim()
], authController.postLogin);

router.post("/signup", [
  check('email')
    .isEmail()
    .withMessage('Please enter a valid email.')
    .custom((value, { req }) => {
      return User.findOne({ email: value }).then(userDoc => {
        if (userDoc) {
          return Promise.reject(
            'E-Mail exists already, please pick a different one.'
          );
        }
      });
    })
    .normalizeEmail(),
  body(
    'password',
    'Please enter a password with only numbers and text and at least 5 characters.'
  )
    .isLength({ min: 5 })
    .isAlphanumeric()
    .trim(),
  body('confirmPassword')
    .trim()
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords have to match!');
      }
      return true;
    })
], authController.postSignup);

router.post("/logout", authController.postLogout);

router.get("/reset", authController.getReset);

router.post("/reset",[
  check('email')
    .isEmail()
    .withMessage('Please enter a valid email.')
    .normalizeEmail(),
], authController.postReset);

router.get("/reset/:token", authController.getNewPassword);

router.post("/new-password", authController.postNewPassword);

// @desc    Auth with Google
// @route   GET /auth/google
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }))

// @desc    Google auth callback
// @route   GET /auth/google/callback
router.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/signup' }),
  (req, res) => { 
    if(req.user){
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
            if(user.spotAccess) {
              req.session.spotAccess = true;
              req.session.save();
            }
            req.session.isLoggedIn = true;
            req.session.user = user;
            req.session.userImage = user.image;
            return req.session.save((err) => {
              console.log(err);
              if(user.Name === undefined && user.CollegeName === undefined && user.Dept === undefined && user.PhoneNo === undefined)
              {
                res.redirect("/user-profile");
              }
              else
              {
                res.redirect("/");
              }
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
      res.redirect('/login');
    }
  }
)

router.post("/google-login", authController.postGoogleLogin);

module.exports = router;

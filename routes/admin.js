const express = require("express");
const { check, body } = require('express-validator/check');

const isAuth = require("../middleware/is-auth");
const adminController = require("../controllers/admin");

const router = express.Router();

router.get("/", isAuth.adminAuth, adminController.getAdminPage);

router.get("/add-admin",isAuth.adminAuth, adminController.getNewAdmin);

router.post("/add-admin", [
  check('email')
    .isEmail()
    .withMessage('Please enter a valid email.')
    // .custom((value, { req }) => {
    //   console.log(value);
    //   return User.findOne({ email: value }).then(userDoc => {
    //     if (userDoc) {
    //       return Promise.reject(
    //         'E-Mail exists already, please pick a different one.'
    //       );
    //     }
    //   });
    // })
    .normalizeEmail(),
  body(
    'password',
    'Please enter a password with only numbers and text and at least 5 characters.'
  )
    .isLength({ min: 5 })
    .isAlphanumeric()
    .trim(),
],isAuth.adminAuth, adminController.postNewAdmin);

// /admin/add-product => GET
router.get("/add-event", isAuth.adminAuth, adminController.getAddEvent);

// /admin/products => GET
router.get("/events", isAuth.adminAuth, adminController.getEvents);

// /admin/add-product => POST
router.post("/add-event",
  [
  body('title')
    .isString()
    .isLength({ min: 3 })
    .withMessage('Please enter a valid Title.')
    .trim(),
  body('price')
    .isFloat()
    .withMessage('Please enter a valid Price Value.'),
  body('description')
    .isLength({ min: 5, max: 400 })
    .trim()
    .withMessage('Please enter a valid Description.')
],
  isAuth.adminAuth, adminController.postAddEvent);

router.get(
  "/edit-event/:eventId", isAuth.adminAuth,
  adminController.getEditEvent
);

router.post("/edit-event", [
  body('title')
    .isString()
    .isLength({ min: 3 })
    .trim(),
  body('price').isFloat(),
  body('description')
    .isLength({ min: 5, max: 400 })
    .trim()
],
  isAuth.adminAuth, adminController.postEditEvent);

router.post("/delete-event", isAuth.adminAuth, adminController.postDeleteEvent);

router.get("/registrations", isAuth.adminAuth, adminController.getRegistrations);

router.get("/registrations/download", isAuth.adminAuth, adminController.getRegistrationsDownload);

router.get("/registrations-pay/download", isAuth.adminAuth, adminController.getRegistrationsPayDownload);

router.get("/registrations/:eventTitle", isAuth.adminAuth, adminController.getRegistrationsDownloadEvent);

router.get('/spot_access_user', isAuth.adminAuth, adminController.getSpotAccess)

router.post('/spot_access_user', isAuth.adminAuth, adminController.postSpotAccess)

router.post('/give_access_user', isAuth.adminAuth, adminController.postgiveAccess)

module.exports = router;

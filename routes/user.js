const express = require("express");
const { check, body } = require('express-validator/check');

const isAuth = require("../middleware/is-auth");
const userController = require("../controllers/user");

const router = express.Router();

router.get("/", userController.getPage);

router.get('/user-profile', isAuth.userAuth, userController.getUserProfile);

router.post('/user-profile',[
    check('name').not().isEmpty().withMessage('Please Enter a valid Name'),
    check('clgname').not().isEmpty().withMessage('Please Enter a valid College Name'),
    check('dept').not().isEmpty().withMessage('Please Enter a valid Department Name'),
    check('address').not().isEmpty().withMessage('Please Enter a valid Place Name'),
    check('state').not().isEmpty().withMessage('Please Enter a valid State Name'),
    body('phoneNo', 'Please Enter a valid Phone Number')
      .exists()
      .isMobilePhone()
      .trim(),
  ], isAuth.userAuth, userController.postUserProfile);

router.get("/events",isAuth.userAuth, userController.getEvents);

router.get("/events/:eventId",isAuth.userAuth, userController.getEvent);

router.get("/register", isAuth.userAuth, userController.getRegistration);

router.post("/register", isAuth.userAuth, userController.postRegistration);

router.post("/register-delete-event", isAuth.userAuth, userController.postRegisterDeleteEvent);

router.get('/checkout', isAuth.userAuth, userController.getCheckout);

router.post('/paynow', isAuth.userAuth, userController.postPayment);

router.post('/callback', userController.postCallback);

router.get('/checkout/success', userController.getCheckoutSuccess);

// router.get('/checkout/cancel', userController.getCheckout);

// router.post('/create-order', isAuth.userAuth, userController.postOrder);

router.get('/orders', isAuth.userAuth, userController.getOrders);

router.get('/order/:userId', userController.getQrOrders);

router.get('/orders/:orderId', isAuth.userAuth, userController.getInvoice);

router.get('/event/:eventTitle', isAuth.userAuth, userController.getEventBrochure);

router.get('/spot-registration', isAuth.userAuth, userController.getSpotRegistrationsPage);

router.post('/spot-registration',[
  check('email')
    .isEmail()
    .withMessage('Please enter a valid email.')
    .normalizeEmail(),
  check('paymentDone')
    .isIn(['true'])
    .withMessage('Please check the Payment received option.')
], isAuth.userAuth, userController.postSpotRegistrationsPage);

router.get('/add-group', isAuth.userAuth, userController.getGroupMemberPage);

router.post('/add-group',[
  check('candidate1Name').not().isEmpty().withMessage('Please Enter a valid Name'),
  body('candidate1Phone', 'Please Enter a valid Phone Number')
      .exists()
      .isMobilePhone()
      .trim(),
  check('candidate2Name').not().isEmpty().withMessage('Please Enter a valid Name'),
  body('candidate2Phone', 'Please Enter a valid Phone Number')
      .exists()
      .isMobilePhone()
      .trim(),
  check('candidate3Name').not().isEmpty().withMessage('Please Enter a valid Name'),
  body('candidate3Phone', 'Please Enter a valid Phone Number')
      .exists()
      .isMobilePhone()
      .trim(),
  check('candidate4Name').not().isEmpty().withMessage('Please Enter a valid Name'),
  body('candidate4Phone', 'Please Enter a valid Phone Number')
      .exists()
      .isMobilePhone()
      .trim(),
], isAuth.userAuth, userController.postGroupMemberPage);

router.post('/query', [
  check('email')
    .isEmail()
    .withMessage('Please enter a valid email.')
    .normalizeEmail(),
  check('name').not().isEmpty().withMessage('Please Enter a valid Name'),
  body('message')
    .isLength({ min: 5, max: 400 })
    .trim()
    .withMessage('Please enter a valid Message.')
], userController.postQuery)

module.exports = router;

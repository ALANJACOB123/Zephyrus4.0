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

router.get('/spot-registration', isAuth.userAuth, userController.getSpotRegistrationsPage);

module.exports = router;

const express = require("express");

const isAuth = require("../middleware/is-auth");
const adminController = require("../controllers/admin");

const router = express.Router();

router.get("/", isAuth.adminAuth, adminController.getAdminPage);

router.get("/add-admin", isAuth.adminAuth, adminController.getNewAdmin);

router.post("/add-admin", isAuth.adminAuth, adminController.postNewAdmin);

// /admin/add-product => GET
router.get("/add-event", isAuth.adminAuth, adminController.getAddEvent);

// /admin/products => GET
router.get("/events", isAuth.adminAuth, adminController.getEvents);

// /admin/add-product => POST
router.post("/add-event", isAuth.adminAuth, adminController.postAddEvent);

router.get(
  "/edit-event/:eventId", isAuth.adminAuth,
  adminController.getEditEvent
);

router.post("/edit-event", isAuth.adminAuth, adminController.postEditEvent);

router.post("/delete-event", isAuth.adminAuth, adminController.postDeleteEvent);

module.exports = router;

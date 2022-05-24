const bcrypt = require("bcryptjs");
const { validationResult } = require('express-validator/check');

const UserAdmin = require("../models/admin-user");
const User = require("../models/user");
const Event = require("../models/event");
const Order = require('../models/order');


exports.getAdminPage = (req, res, next) => {
  res.render("admin/zephyrus", {
    pageTitle: "Zephyrus",
    path: "/",
  });
};

exports.getNewAdmin = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("admin/add-admin", {
    pageTitle: "Add Admin",
    path: "/add-admin",
    errorMessage: message,
    oldInput: {
      email: '',
      password: '',
    },
    validationErrors: []
  });
};

exports.postNewAdmin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(422).render('admin/add-admin', {
      path: '/add-admin',
      pageTitle: 'Add Admin',
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password,
      },
      validationErrors: errors.array()
    });
  }
  bcrypt
    .hash(password, 12)
    .then(hashedPassword => {
      const user = new UserAdmin({
        email: email,
        password: hashedPassword,
      });
      return user.save();
    })
    .then(result => {
      res.redirect('/admin/add-admin');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};


exports.getAddEvent = (req, res, next) => {
  res.render("admin/edit-event", {
    pageTitle: "Add Event",
    path: "/admin/add-event",
    editing: false,
    hasError: false,
    errorMessage: null,
    validationErrors: []
  });
};

exports.postAddEvent = (req, res, next) => {
  const title = req.body.title;
  const imageUrl = req.body.imageUrl;
  const price = req.body.price;
  const description = req.body.description;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(422).render('admin/edit-event', {
      pageTitle: 'Add event',
      path: '/admin/edit-event',
      editing: false,
      hasError: true,
      event: {
        title: title,
        imageUrl: imageUrl,
        price: price,
        description: description
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array()
    });
  }

  const event = new Event({
    title: title,
    price: price,
    description: description,
    imageUrl: imageUrl,
  });
  event
    .save()
    .then((result) => {
      console.log("Event Created");
      res.redirect("/admin/events");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getEvents = (req, res, next) => {
  Event.find()
    // .select('title price -_id')
    // .populate('userId', 'name')
    .then((events) => {
      res.render("admin/event", {
        events: events,
        pageTitle: "Admin Events",
        path: "/admin/events",
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getEditEvent = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect("/admin/events");
  }
  const eventId = req.params.eventId;
  Event.findById(eventId)
    .then((event) => {
      if (!event) {
        return res.redirect("/admin/events");
      }
      res.render("admin/edit-event", {
        pageTitle: "Edit Event",
        path: "/admin/edit-event",
        editing: editMode,
        event: event,
        hasError: false,
        errorMessage: null,
        validationErrors: []
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postEditEvent = (req, res, next) => {
  const eventId = req.body.eventId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const updatedImageUrl = req.body.imageUrl;
  const updatedDesc = req.body.description;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render('admin/edit-event', {
      pageTitle: 'Edit event',
      path: '/admin/edit-event',
      editing: true,
      hasError: true,
      event: {
        title: updatedTitle,
        imageUrl: updatedImageUrl,
        price: updatedPrice,
        description: updatedDesc,
        _id: eventId
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array()
    });
  }


  Event.findById(eventId)
    .then((event) => {
      if (event.userId.toString() !== req.session.user._id.toString()) {
        return res.redirect("/admin/events");
      }
      event.title = updatedTitle;
      event.price = updatedPrice;
      event.description = updatedDesc;
      event.imageUrl = updatedImageUrl;
      return event.save().then((result) => {
        console.log("UPDATED EVENT!");
        res.redirect("/admin/events");
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postDeleteEvent = (req, res, next) => {
  const eventId = req.body.eventId;
  Event.deleteOne({ _id: eventId, userId: req.session.user._id })
    .then(() => {
      console.log("DESTROYED EVENTS");
      res.redirect("/admin/events");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getRegistrations = async (req, res, next) => {
  const docCountUser = await User.countDocuments({}).exec();
  const docCountOrder = await Order.countDocuments({}).exec();
  Event.find()
    .then((events) => {
      res.render("admin/admin-registrations", {
        totalUsers: docCountUser,
        totalOrders: docCountOrder,
        events: events,
        pageTitle: "Registrations",
        path: "/admin/registrations",
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
}
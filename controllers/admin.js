const fs = require('fs');
const path = require('path');

const bcrypt = require("bcryptjs");
const { parse } = require('json2csv');
const fileHelper = require('../util/file');
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
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;
  if (!image) {
    return res.status(422).render('admin/edit-event', {
      pageTitle: 'Add event',
      path: '/admin/add-event',
      editing: false,
      hasError: true,
      product: {
        title: title,
        price: price,
        description: description
      },
      errorMessage: 'Attached file is not an image.',
      validationErrors: []
    });
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(422).render('admin/edit-event', {
      pageTitle: 'Add event',
      path: '/admin/add-event',
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

  const imageUrl = image.path;

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
  const image = req.file;
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
      if (image) {
        fileHelper.deleteFile(product.imageUrl);
        product.imageUrl = image.path;
      }
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
  Event.findById(eventId)
    .then(event => {
      if (!event) {
        return next(new Error('Event not found.'));
      }
      fileHelper.deleteFile(event.imageUrl);
      return Event.deleteOne({ _id: eventId });
    })
    .then(() => {
      console.log('DESTROYED PRODUCT');
      res.redirect('/admin/events');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getRegistrations = async (req, res, next) => {
  const docCountUser = await User.countDocuments({}).exec();
  const docCountOrder = await Order.countDocuments({}).exec();
  User.find().then(user => {
    const fields = ['Name', 'email'];
    const opts = { fields };
    try {
      const csv = parse(user, opts);
      fs.writeFile('data/excel/registrations.csv', csv, function (err) {
        if (err) throw err;
        console.log("Write Successfully!");
      });
    } catch(err) {
      console.error(err);
    }
  });
  Event.find()
    .then((events) => {
      events.forEach(e => {
        e.populate('registration.users.userId')
          .execPopulate()
          .then(user => {
            const users = user.registration.users.userId;
            const fields = ['Name', 'email'];
            const opts = { fields };
            try {
              const csv = parse(users, opts);
              fs.writeFile(`data/excel/${e.title}.csv`, csv, function (err) {
                if (err) throw err;
              });
            } catch (err) {
              console.error(err);
            }
          })
      })
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

exports.getRegistrationsDownload = (req, res, next) => {
  const downloadPath = path.join('data', 'excel', 'registrations.csv')
  const file = fs.createReadStream(downloadPath);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader(
    'Content-Disposition',
    'attachment; filename="registrations.csv"'
  );
  file.pipe(res);
}

exports.getRegistrationsDownloadEvent = (req, res, next) => {
  const eventTitle = req.params.eventTitle;
  const downloadPath = path.join('data', 'excel', `${eventTitle}.csv`)
  const file = fs.createReadStream(downloadPath);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${eventTitle}.csv"`
  );
  file.pipe(res);
}

exports.getSpotAccess = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("admin/admin-spot-access", {
    pageTitle: "Spot Access",
    path: "/admin/spot-access",
    errorMessage: message,
    email: undefined,
    oldInput: {
      email: '',
    },
    validationErrors: []
  });
};

exports.postSpotAccess = (req, res, next) => {
  const email = req.body.email;
  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        return res.status(422).render('admin/admin-spot-access', {
          path: '/admin/spot-access',
          pageTitle: 'Spot Access',
          errorMessage: 'Invalid email',
          email: undefined,
          oldInput: {
            email: email,
          },
          validationErrors: []
        });
      }
      else {
        return res.render("admin/admin-spot-access", {
          pageTitle: "Spot Access",
          path: "/admin/spot-access",
          email: user.email,
          errorMessage: undefined,
          oldInput: {
            email: '',
          },
          validationErrors: []
        });
      }
    })
};

exports.postgiveAccess = (req, res, next) => {
  const spotAccess = req.body.spotAccess;
  const email = req.body.email;
  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        return res.status(422).render('admin/admin-spot-access', {
          path: '/admin/spot-access',
          pageTitle: 'Spot Access',
          errorMessage: 'Invalid email',
          oldInput: {
            email: email,
          },
          validationErrors: []
        });
      }
      else {
        req.session.spotAccess = true;
        req.session.save();
        user.spotAccess = spotAccess;
        user.save().then(result => {
          return res.render("admin/admin-spot-access", {
            pageTitle: "Spot Access",
            path: "/admin/spot-access",
            email: user.email,
            errorMessage: undefined,
            oldInput: {
              email: '',
            },
            validationErrors: []
          });
        })
      }
    })
};
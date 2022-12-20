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
const Spot = require('../models/spot');
const { Console } = require('console');


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
  let email = req.body.email;
  if(email === '@'){
    email = '';
  }
  const password = req.body.password;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
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
  const type = req.body.type;
  const price = req.body.price;
  const description = req.body.description;
  const teacherName = req.body.teacherName;
  const teacherPhone = req.body.teacherPhone;
  const studentName = req.body.studentName;
  const studentPhone = req.body.studentPhone;
  const venue = req.body.venue;
  const active = req.body.active;
  const date = req.body.date;
  if (!image) {
      return res.status(422).render('admin/edit-event', {
      pageTitle: 'Add event',
      path: '/admin/add-event',
      editing: false,
      hasError: true,
      event: {
        title: title,
        price: price,
        type: type,
        description: description,
        teacherName: teacherName,
        teacherPhone: teacherPhone,
        studentName: studentName,
        studentPhone: studentPhone,
        venue: venue,
        active: active,
        date: date,
      },
      errorMessage: 'Attached file is not an image.',
      validationErrors: []
    });
  }
  const imageUrl = image.path;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render('admin/edit-event', {
      pageTitle: 'Add event',
      path: '/admin/add-event',
      editing: false,
      hasError: true,
      event: {
        title: title,
        imageUrl: imageUrl,
        price: price,
        type: type,
        description: description,
        teacherName: teacherName,
        teacherPhone: teacherPhone,
        studentName: studentName,
        studentPhone: studentPhone,
        venue: venue,
        active: active,
        date: date,
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array()
    });
  }

  const event = new Event({
    title: title,
    price: price,
    type: type,
    description: description,
    imageUrl: imageUrl,
    teacherName: teacherName,
    teacherPhone: teacherPhone,
    studentName: studentName,
    studentPhone: studentPhone,
    venue: venue,
    active: active,
    date: date,
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
  const updatedType = req.body.type;
  const updatedPrice = req.body.price;
  const image = req.file;
  const updatedDesc = req.body.description;
  const updatedTeacherName = req.body.teacherName;
  const updatedTeacherPhone = req.body.teacherPhone;
  const updatedStudentName = req.body.studentName;
  const updatedStudentPhone = req.body.studentPhone;
  const updatedVenue = req.body.venue;
  const updatedActive = req.body.active;
  const updatedDate = req.body.date;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render('admin/edit-event', {
      pageTitle: 'Edit event',
      path: '/admin/edit-event',
      editing: true,
      hasError: true,
      event: {
        title: updatedTitle,
        type: updatedType,
        price: updatedPrice,
        description: updatedDesc,
        _id: eventId,
        teacherName: updatedTeacherName,
        teacherPhone: updatedTeacherPhone,
        studentName: updatedStudentName,
        studentPhone: updatedStudentPhone,
        venue: updatedVenue,
        active: updatedActive,
        date: updatedDate,
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array()
    });
  }
  Event.findById(eventId)
    .then((event) => {
      event.title = updatedTitle;
      event.price = updatedPrice;
      event.type = updatedType;
      event.description = updatedDesc;
      event.teacherName = updatedTeacherName;
      event.teacherPhone = updatedTeacherPhone;
      event.studentName = updatedStudentName;
      event.studentPhone = updatedStudentPhone;
      event.venue = updatedVenue;
      event.active = updatedActive;
      event.date = updatedDate;
      if (image) {
        fileHelper.deleteFile(event.imageUrl);
        event.imageUrl = image.path;
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
      console.log('DESTROYED EVENT!!');
      res.redirect('/admin/events');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getRegistrations = async (req, res, next) => {
  let totalRegistrationAmount = 0
  let totalSpotAmount = 0
  const docCountUser = await User.countDocuments({}).exec();
  const docCountOrder = await Order.countDocuments({}).exec();
  Order.find()
    .then((orders) => {
      orders.forEach((order) => {
        order.events.forEach((events) => {
          totalRegistrationAmount = totalRegistrationAmount + events.event.price
        })
      })
    })
  Order.find()
    .then((orders) => {
      let allUsers = [];
      orders.forEach((order) => {
        order.populate('user.userId')
        .execPopulate()
        .then(user => {
          allUsers.push(user.user.userId)
        })
        .then(() => {
          const fields = ['Name', 'email', 'Address', 'CollegeName', 'Dept', 'State', 'PhoneNo'];
          const opts = { fields };
          try {
            const csv = parse(allUsers, opts);
            fs.writeFile('data/excel/registrations-with-payments.csv', csv, function (err) {
              if (err) throw err;
            });
          } catch(err) {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
          }
        })
      })
    })
  const docCountSpot = await Spot.countDocuments({}).exec();
  Spot.find()
    .then((orders) => {
      orders.forEach((order) => {
        order.events.forEach((events) => {
          totalSpotAmount = totalSpotAmount + events.event.price
        })
      })
    })
  User.find().then(user => {
    const fields = ['Name', 'email', 'Address', 'CollegeName', 'Dept', 'State', 'PhoneNo'];
    const opts = { fields };
    try {
      const csv = parse(user, opts);
      fs.writeFile('data/excel/registrations.csv', csv, function (err) {
        if (err) throw err;
      });
    } catch(err) {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    }
  });
  Event.find()
    .then((events) => {
      events.forEach(e => {
        e.populate('registration.users.userId')
          .execPopulate()
          .then(user => {
            if(user.registration.users[0] !== undefined ) 
            {
              let event_users = []
              let infoUser = {}
              user.registration.users.forEach((users) => {
                if(users.userId.group[0] !== undefined) {
                  users.userId.group.forEach((group) => {
                    infoUser = {
                      ...users.userId._doc,
                      ...group.groupMembers
                    }
                  })
                }
                else{
                  infoUser = {
                    ...users.userId._doc,
                  }
                }
                event_users.push(infoUser);
                const fields = ['Name', 'email', 'Address', 'CollegeName', 'Dept', 'State', 'PhoneNo' , 'candidate1Name', 'candidate1Phone', 'candidate2Name', 'candidate2Phone', 'candidate3Name', 'candidate3Phone', 'candidate4Name', 'candidate4Phone', 'candidate5Name', 'candidate5Phone'];
                const opts = { fields };
              try {
                const csv = parse(event_users, opts);
                fs.writeFile(`data/excel/${e.title}.csv`, csv, function (err) {
                  if (err) throw err;
                });
              } catch (err) {
                const error = new Error(err);
                error.httpStatusCode = 500;
                return next(error);
              }
              })
            }
          })
      })
      res.render("admin/admin-registrations", {
        totalUsers: docCountUser,
        totalOrders: docCountOrder,
        totalSpot: docCountSpot,
        totalRegistrationAmount: totalRegistrationAmount,
        totalSpotAmount: totalSpotAmount,
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

exports.getRegistrationsPayDownload = (req, res, next) => {
  const downloadPath = path.join('data', 'excel', 'registrations-with-payments.csv')
  const file = fs.createReadStream(downloadPath);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader(
    'Content-Disposition',
    'attachment; filename="registrations-with-payment.csv"'
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
    path: "/admin/spot_access_user",
    errorMessage: message,
    success: undefined,
    email: undefined,
    oldInput: {
      email: '',
    },
    validationErrors: []
  });
};

exports.postSpotAccess = (req, res, next) => {
  let spot = '';
  const email = req.body.email;
  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        return res.status(422).render('admin/admin-spot-access', {
          path: '/admin/spot_access_user',
          pageTitle: 'Spot Access',
          errorMessage: 'Invalid email',
          success: undefined,
          email: undefined,
          oldInput: {
            email: email,
          },
          validationErrors: []
        });
      }
      else {
        if(user.spotAccess){
          spot = true;
        }
        else
        {
          spot = false;
        }
        return res.render("admin/admin-spot-access", {
          pageTitle: "Spot Access",
          path: "/admin/spot_access_user",
          email: user.email,
          errorMessage: undefined,
          success: undefined,
          spot: spot,
          oldInput: {
            email: '',
          },
          validationErrors: []
        });
      }
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postgiveAccess = (req, res, next) => {
  let success = '';
  let spotAccess = false;
  if(req.body.spotAccess == undefined) {
    spotAccess = false
  }
  else {
    spotAccess = true;
  }
  const email = req.body.email;
  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        return res.status(422).render('admin/admin-spot-access', {
          path: '/admin/spot_access_user',
          pageTitle: 'Spot Access',
          errorMessage: 'Invalid email',
          success: undefined,
          oldInput: {
            email: email,
          },
          validationErrors: []
        });
      }
      else {
        req.session.spotAccess = spotAccess;
        req.session.save();
        user.spotAccess = spotAccess;
        user.save().then(result => {
          if(spotAccess){
            success = 'Spot Access Granted';
          }
          else
          {
            success = 'Spot Access Revoked';
          }
          return res.render("admin/admin-spot-access", {
            pageTitle: "Spot Access",
            path: "/admin/spot_access_user",
            email: undefined,
            errorMessage: undefined,
            success: success,
            oldInput: {
              email: '',
            },
            validationErrors: []
          });
        })
      }
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

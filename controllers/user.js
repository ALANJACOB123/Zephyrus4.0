const fs = require('fs');
const path = require('path');

const PDFDocument = require('pdfkit');

const stripe = require('stripe')('sk_test_51KzxQjSJVrzWpKlz0XpAUgrf3pPSd3TmKQbHrRTKmBUz0IPhTqdAz2NUfqBrmrnohlGVbjgA99xAcLWMWSowKcXL00HQAXe1QE');

const Event = require('../models/event');
const Order = require('../models/order');
const User = require("../models/user");

exports.getPage = (req, res, next) => {
  res.render("user/zephyrus", {
    pageTitle: "Zephyrus 4.0",
    path: "/",
  });
};

exports.getEvents = (req, res, next) => {
  Event.find()
    .then((events) => {
      res.render("user/event-list", {
        events: events,
        pageTitle: "All Events",
        path: "/events",
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getEvent = (req, res, next) => {
  const eventId = req.params.eventId;
  Event.findById(eventId)
    .then((event) => {
      res.render("user/event-detail", {
        event: event,
        pageTitle: event.title,
        path: "/events",
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getRegistration = (req, res, next) => {
  req.user
    .populate('registration.events.eventId')
    .execPopulate()
    .then(user => {
      const events = user.registration.events;
      res.render('user/registration', {
        path: '/register',
        pageTitle: 'Your Events',
        events: events
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postRegistration = (req, res, next) => {
  const eventId = req.body.eventId;
  Event.findById(eventId)
    .then(event => {
      return req.user.addToRegister(event);
    })
    .then(result => {
      res.redirect('/register');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postRegisterDeleteEvent = (req, res, next) => {
  const eventId = req.body.eventId;
  req.user
    .removeFromRegister(eventId)
    .then(result => {
      res.redirect('/register');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getCheckout = (req, res, next) => {
  let events;
  let total = 0;
  req.user
    .populate('registration.events.eventId')
    .execPopulate()
    .then(user => {
      events = user.registration.events;
      total = 0;
      events.forEach(e => {
        total += e.quantity * e.eventId.price;
      });

      return stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: events.map(e => {
          return {
            name: e.eventId.title,
            description: e.eventId.description,
            amount: e.eventId.price * 100,
            currency: 'inr',
            quantity: e.quantity
          };
        }),
        success_url: req.protocol + '://' + req.get('host') + '/checkout/success', // => http://localhost:3000
        cancel_url: req.protocol + '://' + req.get('host') + '/checkout/cancel'
      });
    })
    .then(session => {
      res.render('user/checkout', {
        path: '/checkout',
        pageTitle: 'Checkout',
        events: events,
        totalSum: total,
        sessionId: session.id
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getCheckoutSuccess = (req, res, next) => {
  req.user
    .populate('registration.events.eventId')
    .execPopulate()
    .then(user => {
      const events = user.registration.events.map(i => {
        return { quantity: i.quantity, event: { ...i.eventId._doc } };
      });
      events.forEach(e => {
        Event.find({ _id: e.event._id })
          .then(event => {
            event[0].registrations = event[0].registrations + 1;
            event[0].addTheUser(user);
          })
      })
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user
        },
        events: events
      });
      return order.save();
    })
    .then(result => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect('/orders');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    })
};


exports.postOrder = (req, res, next) => {
  req.user
    .populate('registration.events.eventId')
    .execPopulate()
    .then(user => {
      const events = user.registration.events.map(i => {
        return { event: { ...i.eventId._doc } };
      });
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user
        },
        events: events
      });
      return order.save();
    })
    .then(result => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect('/orders');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    })
};

exports.getOrders = (req, res, next) => {
  Order.find({ 'user.userId': req.user._id })
    .then(orders => {
      res.render('user/orders', {
        path: '/orders',
        pageTitle: 'Your Orders',
        orders: orders
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getUserProfile = (req, res, next) => {
  User.find({ _id: req.user._id })
    .then((user) => {
      if (!user) {
        return res.redirect("/");
      }
      res.render("user/user-profile", {
        pageTitle: "User Profile",
        path: "/user-profile",
        user: user[0],
        errorMessage: null,
        validationErrors: []
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
}

exports.postUserProfile = (req, res, next) => {
  const Name = req.body.name;
  const email = req.body.email;
  const clgname = req.body.clgname;
  const dept = req.body.dept;
  const phoneNo = req.body.phoneNo;
  // const errors = validationResult(req);

  // if (!errors.isEmpty()) {
  //   return res.status(422).render('admin/edit-event', {
  //     pageTitle: 'Edit event',
  //     path: '/admin/edit-event',
  //     editing: true,
  //     hasError: true,
  //     event: {
  //       title: updatedTitle,
  //       imageUrl: updatedImageUrl,
  //       price: updatedPrice,
  //       description: updatedDesc,
  //       _id: eventId
  //     },
  //     errorMessage: errors.array()[0].msg,
  //     validationErrors: errors.array()
  //   });
  // }


  User.find({ _id: req.user._id })
    .then((user) => {
      user[0].Name = Name;
      user[0].CollegeName = clgname;
      user[0].Dept = dept;
      user[0].PhoneNo = phoneNo;
      return user[0].save().then((result) => {
        console.log("UPDATED User Profile!");
        res.redirect("/");
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  Order.findById(orderId)
    .then(order => {
      if (!order) {
        return next(new Error('No order found.'));
      }
      if (order.user.userId.toString() !== req.user._id.toString()) {
        return next(new Error('Unauthorized'));
      }
      const invoiceName = 'invoice-' + orderId + '.pdf';
      const invoicePath = path.join('data', 'invoices', invoiceName);
      const pdfDoc = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="' + invoiceName + '"'
      );
      pdfDoc.pipe(fs.createWriteStream(invoicePath));
      pdfDoc.pipe(res);

      pdfDoc.fontSize(26).text('Invoice', {
        underline: true
      });
      pdfDoc.text('-----------------------');
      let totalPrice = 0;
      order.events.forEach(e => {
        totalPrice += e.quantity * e.event.price;
        pdfDoc
          .fontSize(14)
          .text(
            e.event.title +
            ' - ' +
            e.quantity +
            ' x ' +
            '$' +
            e.event.price
          );
      });
      pdfDoc.text('---');
      pdfDoc.fontSize(20).text('Total Price: $' + totalPrice);

      pdfDoc.end();
      // fs.readFile(invoicePath, (err, data) => {
      //   if (err) {
      //     return next(err);
      //   }
      //   res.setHeader('Content-Type', 'application/pdf');
      //   res.setHeader(
      //     'Content-Disposition',
      //     'inline; filename="' + invoiceName + '"'
      //   );
      //   res.send(data);
      // });
      // const file = fs.createReadStream(invoicePath);

      // file.pipe(res);
    })
    .catch(err => next(err));
};


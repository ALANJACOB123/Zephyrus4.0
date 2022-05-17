const stripe = require('stripe')('sk_test_51KzxQjSJVrzWpKlz0XpAUgrf3pPSd3TmKQbHrRTKmBUz0IPhTqdAz2NUfqBrmrnohlGVbjgA99xAcLWMWSowKcXL00HQAXe1QE');

const Event = require('../models/event');
const Order = require('../models/order');

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
      console.log(err);
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
    .catch((err) => console.log(err));
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
    .catch(err => console.log(err));
};

exports.postRegistration = (req, res, next) => {
  const eventId = req.body.eventId;
  Event.findById(eventId)
    .then(event => {
      return req.user.addToRegister(event);
    })
    .then(result => {
      console.log(result);
      res.redirect('/register');
    });
};

exports.postRegisterDeleteEvent = (req, res, next) => {
  const eventId = req.body.eventId;
  req.user
    .removeFromRegister(eventId)
    .then(result => {
      res.redirect('/register');
    })
    .catch(err => console.log(err));
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
        return { quantity: i.quantity, event: { ...i.eventId._doc } };
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
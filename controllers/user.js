const fs = require('fs');
const path = require('path');
const https = require('https')
const qs = require('querystring')

const PDFDocument = require('pdfkit');
const qrcode = require('qrcode');
const { validationResult } = require('express-validator/check');
const nodemailer = require("nodemailer");
const ejs = require("ejs");
const checksum_lib = require('../paytm/cheksum')
const config = require('../paytm/config');

const Event = require('../models/event');
const Order = require('../models/order');
const User = require("../models/user");
const { events } = require('../models/event');

let transporter = nodemailer.createTransport({
  host: "smtp.zoho.in",
  secure: true,
  port: 465,
  auth: {
    user: "alanjacob433@zohomail.in",
    pass: "7AUisiV3cNXg"
  },
});

exports.getPage = (req, res, next) => {
    res.render("user/zephyrus", {
      pageTitle: "Zephyrus 4.0",
      path: "/",
    });
};

exports.getEvents = (req, res, next) => {
  let message = req.flash('success');
  if(message.length > 0)
  {
    message = message[0];
  }
  else
  {
    message = null;
  }
  console.log(message);
  Event.find()
    .then((events) => {
      res.render("user/event-list", {
        events: events,
        pageTitle: "All Events",
        path: "/events",
        success: message
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
        events: events,
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postRegistration = (req, res, next) => {
  global.f = 0
  const eventId = req.body.eventId;
  Order.find({'user.userId' : req.user._id})
    .then((orders) => {
      if(!(orders == ''))
      {
        orders[0].events.forEach((event) => {
          if(event.event._id == eventId){
            global.f = 1
            req.flash('success' , 'Event Already Registered');
            res.redirect('/events');
          }
        })
      }
      if(f === 0){
        Event.findById(eventId)
        .then((event) => {
          return req.user.addToRegister(event);
        })
        .then(result => {
          req.flash('success' , 'Event Added to Registrations');
          res.redirect('/events');
        })
        .catch(err => {
          const error = new Error(err);
          error.httpStatusCode = 500;
          return next(error);
        });
      }
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
    })
    .then(() => {
      res.render('user/checkout', {
        path: '/checkout',
        pageTitle: 'Checkout',
        events: events,
        totalSum: total,
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postPayment = (req, res, next) => {
  const orderId = 'TEST_' + new Date().getTime()
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
      var paymentDetails = {
        amount: total,
        customerId: user.Name.replace(/\s/g, ''),
        customerEmail:user.email,
        customerPhone: user.PhoneNo
      }
      var params = {};
      params.body = {
        "requestType": "Payment",
        "mid": config.paytmConfig.mid,
        "websiteName": config.paytmConfig.website,
        "orderId": orderId,
        "callbackUrl": `http://localhost:3000/callback`,
        "txnAmount": {
            "value": paymentDetails.amount,
            "currency": "INR",
        },
        "userInfo": {
            "custId": paymentDetails.customerId,
            "email": paymentDetails.customerEmail,
            "mobileNo" : paymentDetails.customerPhone
        },
    };
    return params
    })
    .then((params) => {
    checksum_lib.generateSignature(JSON.stringify(params.body), config.paytmConfig.key).then(function (checksum) {

      params.head = {
          "signature": checksum,
      };

      var post_data = JSON.stringify(params);

      var options = {

          /* for Staging */
          hostname: 'securegw-stage.paytm.in',

          /* for Production */
          // hostname: 'securegw.paytm.in',

          port: 443,
          path: `/theia/api/v1/initiateTransaction?mid=${config.paytmConfig.mid}&orderId=${orderId}`,
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Content-Length': post_data.length, 
          }
      };

      var response = "";
      var post_req = https.request(options, function (post_res) {
          post_res.on('data', function (chunk) {
              response += chunk;
          });

          post_res.on('end', function () {
              response = JSON.parse(response)
              res.writeHead(200, { 'Content-Type': 'text/html' })
              res.write(`<html>
                  <head>
                      <title>Show Payment Page</title>
                  </head>
                  <body>
                      <center>
                          <h1>Please do not refresh this page...</h1>
                      </center>
                      <form method="post" action="https://securegw-stage.paytm.in/theia/api/v1/showPaymentPage?mid=${config.paytmConfig.mid}&orderId=${orderId}" name="paytm">
                          <table border="1">
                              <tbody>
                                    <input type="hidden" name="mid" value="${config.paytmConfig.mid}">
                                    <input type="hidden" name="orderId" value="${orderId}">
                                    <input type="hidden" name="txnToken" value="${response.body.txnToken}">
                                      
                           </tbody>
                        </table>
                                <script type="text/javascript"> document.paytm.submit(); </script>
                     </form>
                  </body>
               </html>`)
              res.end()
          });
      });

      post_req.write(post_data);
      post_req.end();
    });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
}

exports.postCallback = (req, res, next) => {
  data = JSON.parse(JSON.stringify(req.body))
  if(data.STATUS == 'TXN_SUCCESS'){
  const paytmChecksum = data.CHECKSUMHASH
  var isVerifySignature = checksum_lib.verifySignature(data, config.paytmConfig.key, paytmChecksum)
  if (isVerifySignature) {
      console.log("Checksum Matched"); 
      res.render('user/payment-success', {
        path: '/success',
        pageTitle: 'Success',
      });
      } else {
        console.log("Checksum Mismatched");
        res.render('user/payment-failure', {
          path: '/Failed',
          pageTitle: 'Failed',
        });
      }  
  }
  else
  {
    res.render('user/payment-failure', {
      path: '/Failed',
      pageTitle: 'Failed',
    });
  }       
}

exports.getCheckoutSuccess = (req, res, next) => {
  let total = 0;
  let Allevents;
  var today = new Date();
  var dd = String(today.getDate()).padStart(2, '0');
  var mm = String(today.getMonth() + 1).padStart(2, '0');
  var yyyy = today.getFullYear();
  today = mm + '/' + dd + '/' + yyyy;
  req.user
    .populate('registration.events.eventId')
    .execPopulate()
    .then(user => {
      const events = user.registration.events.map(i => {
        return { quantity: i.quantity, event: { ...i.eventId._doc } };
      });
      Allevents = events;
      events.forEach(e => {
        total += e.quantity * e.event.price;
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
          userId: req.user,
        },
        events: events,
        created_at : Date.now()
      });
      return order.save();
    })
    .then(result => {
      return req.user.clearCart();
    })
    .then(async () => {
      Order.findOne({ 'user.userId': req.user._id })
      .sort({created_at: -1})
      .exec(async (err, post) => {
        const input_text = `http://localhost:3000/order/${req.user._id}`
        console.log(input_text);
        let img = await qrcode.toDataURL(input_text);
        const data = await ejs.renderFile( "./templates/receipt.ejs", { name: req.user.Name, date: today, events: Allevents, total: total, orderId: post._id , src: img});
          return transporter.sendMail({
            to: req.user.email,
            from: "alanjacob433@gmail.com",
            subject: "Event Registration Receipt",
            attachDataUrls: true,
            html: data
          });
      });
      res.redirect('/orders');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    })
};

exports.getQrOrders = (req, res, next) => {
  const userId = req.params.userId;
  Order.find({ 'user.userId': userId })
    .then(orders => {
      console.log(orders)
      res.render('user/orders', {
        path: '/orders',
        pageTitle: 'Your Orders',
        orders: orders,
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getOrders = (req, res, next) => {
  Order.find({ 'user.userId': req.user._id })
    .then(orders => {
      res.render('user/orders', {
        path: '/orders',
        pageTitle: 'Your Orders',
        orders: orders,
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
        oldInput: {
          name: undefined,
          clgname: undefined,
          dept: undefined,
          address: undefined,
          state: undefined,
          phoneNo: undefined
        },
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
  const address = req.body.address;
  const state = req.body.state;
  const phoneNo = req.body.phoneNo;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render('user/user-profile', {
      pageTitle: 'User Profile',
      path: '/user-profile',
      errorMessage: errors.array()[0].msg,
      oldInput: {
        name: Name,
        email: email,
        clgname: clgname,
        dept: dept,
        address: address,
        state: state,
        phoneNo: phoneNo
      },
      user: {
        name: undefined,
        clgname: undefined,
        email: undefined,
        dept: undefined,
        address: undefined,
        state: undefined,
        phoneNo: undefined
      },
      validationErrors: errors.array()
    });
  }
  User.find({ _id: req.user._id })
    .then((user) => {
      user[0].Name = Name;
      user[0].CollegeName = clgname;
      user[0].Dept = dept;
      user[0].Address = address;
      user[0].State = state;
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

exports.getSpotRegistrationsPage = (req, res, next) => {
  res.render("user/spot-registration", {
    pageTitle: "Spot Registration",
    path: "/spot-registration",
  });
};

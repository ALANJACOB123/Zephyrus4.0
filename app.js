const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const morgan = require('morgan');
const passport = require('passport');

require('./util/passport')(passport)

const errorController = require('./controllers/error');
const User = require('./models/user');
const adminUser = require('./models/admin-user');

const MONGODB_URI =
  "mongodb+srv://alanjacob:Alanandg123@cluster0.7opvu.mongodb.net/Zephyrus";

const app = express();
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: 'sessions'
});
const csrfProtection = csrf();

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/user');
const authRoutes = require('./routes/auth');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  session({
    secret: 'my secret',
    resave: false,
    saveUninitialized: false,
    store: store
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(csrfProtection);
app.use(flash());
app.use(morgan('dev'));

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.isAdminAuthenticated = req.session.isAdminLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  if (req.path === "/admin-login" || req.path === "/admin") {
    adminUser
      .findById(req.session.user._id)
      .then((user) => {
        if (!user) {
          return next();
        }
        req.user = user;
        next();
      })
      .catch((err) => console.log(err));
  } else {
    User.findById(req.session.user._id)
      .then((user) => {
        if (!user) {
          return next();
        }
        req.user = user;
        next();
      })
      .catch((err) => console.log(err));
  }
});

app.use('/admin', adminRoutes);
app.use(userRoutes);
app.use(authRoutes);

app.get('/500', errorController.get500);

app.use(errorController.get404);

// app.use((error, req, res, next) => {
//   res.status(500).render('500', {
//     pageTitle: 'Error!',
//     path: '/500',
//     isAuthenticated: req.session.isLoggedIn
//   });
// });

mongoose
  .connect(MONGODB_URI)
  .then(result => {
    app.listen(3000);
  })
  .catch(err => {
    console.log(err);
  });

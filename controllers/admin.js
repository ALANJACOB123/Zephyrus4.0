const bcrypt = require("bcryptjs");

const UserAdmin = require("../models/admin-user");
const Event = require("../models/event");

exports.getAdminPage = (req, res, next) => {
  res.render("admin/zephyrus", {
    pageTitle: "Zephyrus",
    path: "/",
  });
};

exports.getNewAdmin = (req, res, next) => {
  res.render("admin/add-admin", {
    pageTitle: "Add Admin",
    path: "/add-admin",
  });
};

exports.postNewAdmin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  UserAdmin
    .findOne({ email: email })
    .then((userDoc) => {
      if (userDoc) {
        // req.flash(
        //   "error",
        //   "E-Mail exists already, please pick a different one."
        // );
        return res.redirect("/admin/add-admin");
      }
      return bcrypt
        .hash(password, 12)
        .then((hashedPassword) => {
          const userAdmin = new UserAdmin({
            email: email,
            password: hashedPassword,
          });
          return userAdmin.save();
        })
        .then((result) => {
          res.redirect("/admin");
        });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getAddEvent = (req, res, next) => {
  res.render("admin/edit-event", {
    pageTitle: "Add Event",
    path: "/admin/add-event",
    editing: false,
  });
};

exports.postAddEvent = (req, res, next) => {
  const title = req.body.title;
  const imageUrl = req.body.imageUrl;
  const price = req.body.price;
  const description = req.body.description;
  const event = new Event({
    title: title,
    price: price,
    description: description,
    imageUrl: imageUrl,
    userId: req.session.user,
  });
  event
    .save()
    .then((result) => {
      console.log("Event Created");
      res.redirect("/admin/events");
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getEvents = (req, res, next) => {
  Event.find({ userId: req.session.user._id })
    // .select('title price -_id')
    // .populate('userId', 'name')
    .then((events) => {
      console.log(events);
      res.render("admin/event", {
        events: events,
        pageTitle: "Admin Events",
        path: "/admin/events",
      });
    })
    .catch((err) => console.log(err));
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
      });
    })
    .catch((err) => console.log(err));
};

exports.postEditEvent= (req, res, next) => {
  const eventId = req.body.eventId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const updatedImageUrl = req.body.imageUrl;
  const updatedDesc = req.body.description;

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
    .catch((err) => console.log(err));
};

exports.postDeleteEvent = (req, res, next) => {
  const eventId = req.body.eventId;
  Event.deleteOne({ _id: eventId, userId: req.session.user._id })
    .then(() => {
      console.log("DESTROYED EVENTS");
      res.redirect("/admin/events");
    })
    .catch((err) => console.log(err));
};
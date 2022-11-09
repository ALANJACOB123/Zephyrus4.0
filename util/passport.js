const GoogleStrategy = require('passport-google-oauth20').Strategy
const mongoose = require('mongoose')
const User = require('../models/user')

module.exports = function (passport) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: '345773867041-4gi68dl6k9sfruopums2mh1ej3k5l804.apps.googleusercontent.com',
        clientSecret: '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',
        callbackURL: '/auth/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        const newUser = {
          googleId: profile.id,
          email: profile.emails[0].value,
          image: profile._json.picture,
          registration: { events: [] }
        }
        try {
          let user = await User.findOne({ googleId: profile.id })
          if (user) {
            done(null, user)
          } else {
            user = await User.create(newUser)
            done(null, user)
          }
        } catch (err) {
          console.error(err)
        }
      }
    )
  )
  passport.serializeUser((user, done) => {
    done(null, user.id)
  })

  passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
        done(err, user)
    })
  })
}

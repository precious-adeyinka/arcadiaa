var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User = require('../models/user');

// In order to support login sessions, Passport will serialize and deserialize user instances to and from the session.
passport.serializeUser(function(user, done) {
  // the first argument is null because there is no errors
  // the done function is part of passport internal logic
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

// SIGNUP
passport.use('local.signup', new LocalStrategy({
  passReqToCallback: true
}, function(req, username, password, done) {
  username = username.trim().toLowerCase();
  req.checkBody('username', 'Your username should have at least 2 characters').notEmpty().isLength({min: 2, max: 20});
  req.checkBody('password', 'Your password must have at least 6 characters').notEmpty().isLength({min: 6});
  req.checkBody('password2', 'Passwords are different').equals(req.body.password);
  var errors = req.validationErrors();
  if (errors) {
    var messages = [];
    errors.forEach(function(error) {
      messages.push(error.msg);
    });
    return done(null, false, req.flash('error', messages));
  }
  // Search if username is already in the database
  User.findOne({
    'username': username
  }, function(err, user) {
    if (err) {
      return done(err);
    }
    if (user) {
      return done(null, false, {message: 'Username is already in use'});
    }
    // Username is not already used, then we can create a new user
    var newUser = new User();
    newUser.username = username
    newUser.password = newUser.encryptPassword(password);
    // We save in
    newUser.save(function(err, result) {
      if (err) {
        return done(err);
      }
      return done(null, newUser, req.flash('success', 'Successfully registered'));
    })
  });
}));

// SIGNIN
passport.use('local.signin', new LocalStrategy({
  passReqToCallback: true
}, function(req, username, password, done) {
  username = username.trim().toLowerCase();
  req.checkBody('username', 'Invalid username').notEmpty().isLength({min: 2, max: 20});
  req.checkBody('password', 'Invalid password').notEmpty().isLength({min: 6});
  var errors = req.validationErrors();
  if (errors) {
    var messages = [];
    errors.forEach(function(error) {
      messages.push(error.msg);
    });
    return done(null, false, req.flash('error', messages));
  }

  User.findOne({
    'username': username
  }, function(err, user) {
    if (err) {
      return done(err);
    }
    if (!user) {
      return done(null, false, {message: 'No user found'});
    }
    if (!user.validPassword(password)) {
      return done(null, false, {message: 'Wrong password'});
    }
    // There is no errors
    return done(null, user, req.flash('success', 'Successfully logged'));
  });
}));

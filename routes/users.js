const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const { User } = require('../models');

router.get('/register', (req, res) => res.render('register'));

router.post('/register', async (req, res) => {
  const { username, password, password2 } = req.body;
  let errors = [];

  if (!username || !password || !password2) {
    errors.push({ msg: 'Please fill in all fields' });
  }

  if (password != password2) {
    errors.push({ msg: 'Passwords do not match' });
  }

  if (password.length < 6) {
    errors.push({ msg: 'Password should be at least 6 characters' });
  }

  if (errors.length > 0) {
    res.render('register', { errors, username, password, password2 });
  } else {
    const user = await User.findOne({ where: { username } });
    if (user) {
      errors.push({ msg: 'Username already exists' });
      res.render('register', { errors, username, password, password2 });
    } else {
      const newUser = new User({ username, password });
      bcrypt.genSalt(10, (err, salt) => bcrypt.hash(newUser.password, salt, async (err, hash) => {
        if (err) throw err;
        newUser.password = hash;
        await newUser.save();
        req.flash('success_msg', 'You are now registered and can log in');
        res.redirect('/users/login');
      }));
    }
  }
});

router.get('/login', (req, res) => res.render('login'));

router.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/users/login',
    failureFlash: true
  })(req, res, next);
});

router.get('/logout', (req, res) => {
  req.logout();
  req.flash('success_msg', 'You are logged out');
  res.redirect('/users/login');
});

module.exports = router;

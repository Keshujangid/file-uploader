// routes/auth.js
const express = require('express');
const route = express.Router();
const controller = require('../controller/authController');
const {getDrive} = require('../controller/driveController');
const validator = require('../middleware/formsValidator');


route.get('/', getDrive);
route.get('/login', controller.getLogin);
route.post('/login',validator.loginValidator ,controller.postLogin);
route.get('/signup', controller.getSignup);
route.post('/signup', validator.validateSignUp, controller.postSignup);
route.get('/logout', (req, res, next) => {
    req.logOut((err) => {
        if (err) {
            return next(err);
        }
        res.redirect('/drive');
    });
});

module.exports = route;

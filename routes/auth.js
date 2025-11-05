const express = require('express');
const router = express.Router();
const signup = require('../controllers/auth/signup');
const login = require('../controllers/auth/login');
const verify = require('../controllers/auth/verify');

router.route('/login').post(login)
router.route('/signup').post(signup);
router.route('/verify').post(verify);


module.exports = router;
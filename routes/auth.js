const express = require('express');
const router = express.Router();
const signup = require('../controllers/auth/signup');
const login = require('../controllers/auth/login');
const verify = require('../controllers/auth/verify');
const completeOnboarding = require('../controllers/auth/complete-onboarding');
const authMiddleware = require('../middleware/auth');

router.route('/login').post(login)
router.route('/signup').post(signup);
router.route('/verify').post(verify);
router.route('/onboarding').post(authMiddleware, completeOnboarding);


module.exports = router;
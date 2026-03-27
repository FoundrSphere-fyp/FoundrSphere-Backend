const express = require('express');
const router = express.Router();
const signup = require('../controllers/auth/signup');
const login = require('../controllers/auth/login');
const verify = require('../controllers/auth/verify');
const completeOnboarding = require('../controllers/auth/complete-onboarding');
const getAccountSettings = require('../controllers/auth/get-account-settings');
const updateAccountSettings = require('../controllers/auth/update-account-settings');
const authMiddleware = require('../middleware/auth');

router.route('/login').post(login)
router.route('/signup').post(signup);
router.route('/verify').post(verify);
router.route('/onboarding').post(authMiddleware, completeOnboarding);
router.route('/account-settings').get(authMiddleware, getAccountSettings);
router.route('/account-settings').put(authMiddleware, updateAccountSettings);


module.exports = router;
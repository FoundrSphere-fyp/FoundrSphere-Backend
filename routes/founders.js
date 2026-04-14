const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const getFounders = require('../controllers/founders/get-founders');
const getSpecificFounder = require('../controllers/founders/get-specific-founder');
const getSpecificInvestor = require('../controllers/founders/get-specific-investor');
const getInvestors = require('../controllers/founders/get-investors');
const recommendInvestorsForFounder = require('../controllers/founders/recommend-investors');
const recommendFoundersForInvestor = require('../controllers/founders/recommend-founders');
const recommendCofoundersForFounder = require('../controllers/founders/recommend-cofounders');

router.route('/get-founders').get(getFounders);
router.route('/get-specific-founder').post(getSpecificFounder);
router.route('/get-specific-investor').post(getSpecificInvestor);
router.route('/get-investors').get(getInvestors);
router.route('/recommend-investors').get(authMiddleware, recommendInvestorsForFounder);
router.route('/recommend-founders').get(authMiddleware, recommendFoundersForInvestor);
router.route('/recommend-cofounders').get(authMiddleware, recommendCofoundersForFounder);

module.exports = router;
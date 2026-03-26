const express = require('express');
const router = express.Router();
const getFounders = require('../controllers/founders/get-founders');
const getSpecificFounder = require('../controllers/founders/get-specific-founder');
const getSpecificInvestor = require('../controllers/founders/get-specific-investor');
const getInvestors = require('../controllers/founders/get-investors');

router.route('/get-founders').get(getFounders);
router.route('/get-specific-founder').post(getSpecificFounder);
router.route('/get-specific-investor').post(getSpecificInvestor);
router.route('/get-investors').get(getInvestors);

module.exports = router;
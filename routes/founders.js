const express = require('express');
const router = express.Router();
const getFounders = require('../controllers/founders/get-founders');


router.route('/get-founders').get(getFounders)


module.exports = router;
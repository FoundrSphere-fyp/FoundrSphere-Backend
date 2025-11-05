const express = require('express');
const router = express.Router();
const addGroup = require('../controllers/group/add-group');
const getGroups = require('../controllers/group/get-groups');

router.route('/add-group').post(addGroup)
router.route('/get-groups').get(getGroups)


module.exports = router;
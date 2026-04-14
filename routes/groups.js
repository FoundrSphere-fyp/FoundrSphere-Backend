const express = require('express');
const router = express.Router();
const addGroup = require('../controllers/group/add-group');
const getGroups = require('../controllers/group/get-groups');
const joinGroup = require('../controllers/group/join-group');
const getGroupData = require('../controllers/group/get-group-data');
const getGroupMembers = require('../controllers/group/get-group-members');
const checkGroupMembership = require('../controllers/group/check-group-membership');
const getUserGroups = require('../controllers/group/get-user-groups');
const leaveGroup = require('../controllers/group/leave-group');
const getGroupEvents = require('../controllers/group/get-group-events');

router.route('/add-group').post(addGroup)
router.route('/get-groups').get(getGroups)
router.route('/join-group').post(joinGroup)
router.route('/get-group-data').post(getGroupData)
router.route('/get-group-members').post(getGroupMembers)
router.route('/check-group-membership').post(checkGroupMembership)
router.route('/get-user-groups').post(getUserGroups)
router.route('/leave-group').post(leaveGroup)
router.route('/get-group-events').post(getGroupEvents)


module.exports = router;
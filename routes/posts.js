const express = require('express');
const router = express.Router();
const getGroupPosts = require('../controllers/post/get-group-posts');


router.route('/get-group-posts').post(getGroupPosts)


module.exports = router;
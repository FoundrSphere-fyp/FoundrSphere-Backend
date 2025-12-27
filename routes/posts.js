const express = require('express');
const router = express.Router();
const getGroupPosts = require('../controllers/post/get-group-posts');
const { uploadMiddleware, uploadAsset } = require('../controllers/post/upload-asset');
const createGroupPost = require('../controllers/post/create-group-post');

router.route('/get-group-posts').post(getGroupPosts);
router.route('/upload-asset').post(uploadMiddleware, uploadAsset);

router.route('/create-group-post').post(createGroupPost);

module.exports = router;
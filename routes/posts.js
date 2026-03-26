const express = require('express');
const router = express.Router();
const getGroupPosts = require('../controllers/post/get-group-posts');
const { uploadMiddleware, uploadAsset } = require('../controllers/post/upload-asset');
const createGroupPost = require('../controllers/post/create-group-post');
const getSinglePost = require('../controllers/post/get-single-post');
const toggleLike = require('../controllers/post/toggle-like');
const addComment = require('../controllers/post/add-comment');

router.route('/get-group-posts').post(getGroupPosts);
router.route('/upload-asset').post(uploadMiddleware, uploadAsset);

router.route('/create-group-post').post(createGroupPost);
router.route('/get-single-post').post(getSinglePost);
router.route('/toggle-like').post(toggleLike);
router.route('/add-comment').post(addComment);

module.exports = router;
const express = require('express');
const router = express.Router();
const generateEmbeddings = require('../controllers/embeddings/generate-embeddings');

// Dashboard routes
router.post('/generate-embeddings', generateEmbeddings);

module.exports = router;

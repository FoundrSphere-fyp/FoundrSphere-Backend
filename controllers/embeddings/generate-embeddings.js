const asyncWrapper = require("../../middleware/async");
const { embedText } = require("../../services/azureEmbed");

const generateEmbeddings = asyncWrapper(async (req, res) => {
  try {
    const { textForEmbedding } = req.body;

    if (!textForEmbedding) {
      return res.status(400).json({ type: "error", message: "Text for embedding is required." });
    }

    const embeddingVector = await embedText(textForEmbedding);

    if (!embeddingVector) {
      return res.status(503).json({
        type: "error",
        message: "Embedding service unavailable or empty input.",
      });
    }

    return res.status(200).json({
      type: "success",
      embeddingVector,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      type: "error",
      message: "Error occured while generating embeddings, please try again.",
    });
  }
});

module.exports = generateEmbeddings;

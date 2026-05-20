const { Pinecone } = require("@pinecone-database/pinecone");

let client = null;

function isPineconeConfigured() {
  const apiKey = String(process.env.PINECONE_API_KEY || "").trim();
  const indexName = String(process.env.PINECONE_INDEX_NAME || "").trim();
  return Boolean(apiKey && indexName);
}

function getPineconeClient() {
  if (!isPineconeConfigured()) {
    return null;
  }

  if (!client) {
    client = new Pinecone({
      apiKey: String(process.env.PINECONE_API_KEY).trim(),
    });
  }

  return client;
}

function getChatIndex() {
  const pc = getPineconeClient();
  if (!pc) return null;

  const indexName = String(process.env.PINECONE_INDEX_NAME).trim();
  return pc.index(indexName);
}

/**
 * One namespace per user for isolation.
 * @param {string} userId
 */
function getUserNamespace(userId) {
  const index = getChatIndex();
  if (!index) return null;
  return index.namespace(String(userId));
}

module.exports = {
  isPineconeConfigured,
  getChatIndex,
  getUserNamespace,
};

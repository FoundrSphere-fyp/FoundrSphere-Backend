const { AzureOpenAI } = require("openai");

const MAX_CHARS = 30000;

/**
 * @param {string} text
 * @returns {Promise<number[]|null>}
 */
async function embedText(text) {
  const trimmed = String(text || "").trim().slice(0, MAX_CHARS);
  if (!trimmed) {
    return null;
  }

  if (!process.env.AZURE_OPENAI_ENDPOINT || !process.env.AZURE_OPENAI_API_KEY) {
    console.warn("[embeddings] AZURE_OPENAI_ENDPOINT or AZURE_OPENAI_API_KEY missing; skipping embedding.");
    return null;
  }

  const client = new AzureOpenAI({
    endpoint: process.env.AZURE_OPENAI_ENDPOINT,
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    deployment: "text-embedding-3-large",
    apiVersion: process.env.AZURE_OPENAI_API_VERSION,
  });

  const embeddingResponse = await client.embeddings.create({
    model: "text-embedding-3-large",
    input: trimmed,
  });

  return embeddingResponse.data[0].embedding;
}

module.exports = { embedText };

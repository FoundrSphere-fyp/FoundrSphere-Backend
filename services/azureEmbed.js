const { AzureOpenAI } = require("openai");

const MAX_CHARS = 30000;
const DEFAULT_AZURE_DEPLOYMENT = "text-embedding-3-large";
const DEFAULT_LOCAL_MODEL = "Xenova/all-MiniLM-L6-v2";

let localExtractor = null;

function getEmbeddingProvider() {
  return String(process.env.EMBEDDING_PROVIDER || "azure").trim().toLowerCase();
}

function normalizeAzureConfig() {
  const rawEndpoint = String(process.env.AZURE_OPENAI_ENDPOINT || "").trim();
  const apiKey = String(process.env.AZURE_OPENAI_API_KEY || "").trim();
  const apiVersion = String(process.env.AZURE_OPENAI_API_VERSION || "").trim();
  const envDeployment = String(process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT || "").trim();

  if (!rawEndpoint || !apiKey) return null;

  let endpoint = rawEndpoint;
  let deployment = envDeployment || DEFAULT_AZURE_DEPLOYMENT;

  // Supports both resource endpoint and full deployment URL copied from Azure portal.
  try {
    const parsed = new URL(rawEndpoint);
    const deploymentMatch = parsed.pathname.match(/\/openai\/deployments\/([^/]+)/i);
    if (deploymentMatch && deploymentMatch[1]) {
      deployment = envDeployment || decodeURIComponent(deploymentMatch[1]);
      endpoint = `${parsed.protocol}//${parsed.host}`;
    }
  } catch (_err) {
    // Keep the original endpoint; request will fail with a descriptive error if invalid.
  }

  return {
    endpoint,
    apiKey,
    apiVersion: apiVersion || undefined,
    deployment,
  };
}

async function getLocalExtractor() {
  if (localExtractor) return localExtractor;

  const { pipeline } = await import("@xenova/transformers");
  const modelName = String(process.env.EMBEDDING_LOCAL_MODEL || DEFAULT_LOCAL_MODEL).trim();

  localExtractor = await pipeline("feature-extraction", modelName);
  return localExtractor;
}

async function embedWithLocalModel(text) {
  try {
    const extractor = await getLocalExtractor();
    const output = await extractor(text, {
      pooling: "mean",
      normalize: true,
    });

    const vector = Array.from(output?.data || []);
    if (!vector.length) {
      console.warn("[embeddings] Local model returned empty vector.");
      return null;
    }

    return vector;
  } catch (err) {
    console.error("[embeddings] Local Xenova embedding failed:", err?.message || err);
    return null;
  }
}

async function embedWithAzure(text) {
  const azure = normalizeAzureConfig();
  if (!azure) {
    console.warn("[embeddings] AZURE_OPENAI_ENDPOINT or AZURE_OPENAI_API_KEY missing; skipping embedding.");
    return null;
  }

  try {
    const client = new AzureOpenAI({
      endpoint: azure.endpoint,
      apiKey: azure.apiKey,
      deployment: azure.deployment,
      apiVersion: azure.apiVersion,
    });

    const embeddingResponse = await client.embeddings.create({
      model: azure.deployment,
      input: text,
    });

    const vector = embeddingResponse?.data?.[0]?.embedding;
    if (!Array.isArray(vector) || vector.length === 0) {
      console.warn("[embeddings] Azure returned empty vector.");
      return null;
    }

    return vector;
  } catch (err) {
    console.error("[embeddings] Azure embedding failed:", err?.message || err);
    return null;
  }
}

/**
 * @param {string} text
 * @returns {Promise<number[]|null>}
 */
async function embedText(text) {
  const trimmed = String(text || "").trim().slice(0, MAX_CHARS);
  if (!trimmed) {
    return null;
  }

  const provider = getEmbeddingProvider();

  if (provider === "local" || provider === "xenova") {
    return embedWithLocalModel(trimmed);
  }

  return embedWithAzure(trimmed);
}

module.exports = { embedText };

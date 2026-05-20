const axios = require("axios");
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

/**
 * HF Inference Endpoint returns e.g. [[0.01, -0.02, ...]] for one string.
 * @param {unknown} data
 * @returns {number[]|null}
 */
function parseHfEmbeddingResponse(data) {
  if (!data) return null;

  if (Array.isArray(data)) {
    if (data.length === 0) return null;
    if (typeof data[0] === "number") return data;
    if (Array.isArray(data[0])) return data[0];
  }

  if (Array.isArray(data?.embeddings)) {
    return parseHfEmbeddingResponse(data.embeddings);
  }

  if (Array.isArray(data?.data) && data.data[0]?.embedding) {
    return data.data[0].embedding;
  }

  return null;
}

async function embedWithHf(text) {
  const url = String(
    process.env.HF_EMBED_URL ||
      "https://ekgrbh8j8gghyept.eu-west-1.aws.endpoints.huggingface.cloud"
  ).trim();
  const apiKey = String(process.env.HF_TOKEN || "").trim();

  if (!url || !apiKey) {
    console.warn("[embeddings] HF_EMBED_URL or HF_TOKEN missing; skipping HF embedding.");
    return null;
  }

  try {
    const parameters = {};
    const rawParams = String(process.env.HF_EMBED_PARAMETERS || "").trim();
    if (rawParams) {
      try {
        Object.assign(parameters, JSON.parse(rawParams));
      } catch (_err) {
        console.warn("[embeddings] HF_EMBED_PARAMETERS is not valid JSON; using {}.");
      }
    }

    const response = await axios.post(
      url,
      { inputs: text, parameters },
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 60000,
      }
    );

    const vector = parseHfEmbeddingResponse(response.data);
    if (!Array.isArray(vector) || vector.length === 0) {
      console.warn("[embeddings] HF endpoint returned empty or unrecognized shape.");
      return null;
    }

    return vector;
  } catch (err) {
    const detail = err.response?.data || err.message;
    console.error("[embeddings] HF embedding failed:", detail);
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

  if (provider === "hf" || provider === "huggingface") {
    return embedWithHf(trimmed);
  }

  return embedWithAzure(trimmed);
}

module.exports = { embedText, getEmbeddingProvider };

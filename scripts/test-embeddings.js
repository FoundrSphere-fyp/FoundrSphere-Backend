require("dotenv").config();

const { embedText } = require("../services/azureEmbed");

function cosineSimilarity(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length === 0 || a.length !== b.length) {
    return 0;
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom ? dot / denom : 0;
}

async function main() {
  const provider = String(process.env.EMBEDDING_PROVIDER || "azure").trim();
  const localModel = String(process.env.EMBEDDING_LOCAL_MODEL || "").trim();

  console.log("[test] EMBEDDING_PROVIDER:", provider);
  if (localModel) {
    console.log("[test] EMBEDDING_LOCAL_MODEL:", localModel);
  }

  const textA = process.argv[2] || "FinTech founder building B2B payments platform for SMEs in Pakistan.";
  const textB =
    process.argv[3] ||
    "B2B startup seeking technical cofounder with product and backend engineering experience.";

  console.log("[test] Generating embedding for text A...");
  const vecA = await embedText(textA);

  if (!Array.isArray(vecA) || vecA.length === 0) {
    console.error("[test] FAIL: embedding A is empty/null.");
    process.exit(1);
  }

  console.log("[test] OK: embedding A length =", vecA.length);
  console.log("[test] A sample:", vecA.slice(0, 8));

  console.log("[test] Generating embedding for text B...");
  const vecB = await embedText(textB);

  if (!Array.isArray(vecB) || vecB.length === 0) {
    console.error("[test] FAIL: embedding B is empty/null.");
    process.exit(1);
  }

  console.log("[test] OK: embedding B length =", vecB.length);
  console.log("[test] B sample:", vecB.slice(0, 8));

  if (vecA.length !== vecB.length) {
    console.error("[test] FAIL: embedding vector lengths do not match.");
    process.exit(1);
  }

  const similarity = cosineSimilarity(vecA, vecB);
  console.log("[test] Cosine similarity (A,B):", similarity.toFixed(6));
  console.log("[test] SUCCESS: Embedding pipeline is working.");
}

main().catch((err) => {
  console.error("[test] FAIL:", err?.message || err);
  process.exit(1);
});

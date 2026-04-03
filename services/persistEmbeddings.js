const FounderProfile = require("../models/FounderProfile");
const InvestorProfile = require("../models/InvestorProfile");
const Project = require("../models/Project");
const { embedText } = require("./azureEmbed");
const {
  buildFounderEmbeddingText,
  buildInvestorEmbeddingText,
  buildProjectEmbeddingText,
} = require("./embeddingTextBuilders");

async function saveFounderProfileEmbeddingByUserId(userId) {
  const profile = await FounderProfile.findOne({ userId });
  if (!profile) return;
  const text = buildFounderEmbeddingText(profile.toObject ? profile.toObject() : profile);
  const vec = await embedText(text);
  if (vec) {
    await FounderProfile.updateOne({ _id: profile._id }, { embedding: vec });
  }
}

async function saveInvestorProfileEmbeddingByUserId(userId) {
  const profile = await InvestorProfile.findOne({ userId });
  if (!profile) return;
  const text = buildInvestorEmbeddingText(profile.toObject ? profile.toObject() : profile);
  const vec = await embedText(text);
  if (vec) {
    await InvestorProfile.updateOne({ _id: profile._id }, { embedding: vec });
  }
}

async function saveProjectEmbeddingById(projectId) {
  const project = await Project.findById(projectId);
  if (!project) return;
  const text = buildProjectEmbeddingText(project.toObject ? project.toObject() : project);
  const vec = await embedText(text);
  if (vec) {
    await Project.updateOne({ _id: project._id }, { embedding: vec });
  }
}

/**
 * Safe wrapper: logs errors, never throws (callers should not fail main flow).
 */
async function trySaveFounderEmbedding(userId) {
  try {
    await saveFounderProfileEmbeddingByUserId(userId);
  } catch (err) {
    console.error("[embeddings] FounderProfile embedding failed:", err.message || err);
  }
}

async function trySaveInvestorEmbedding(userId) {
  try {
    await saveInvestorProfileEmbeddingByUserId(userId);
  } catch (err) {
    console.error("[embeddings] InvestorProfile embedding failed:", err.message || err);
  }
}

async function trySaveProjectEmbedding(projectId) {
  try {
    await saveProjectEmbeddingById(projectId);
  } catch (err) {
    console.error("[embeddings] Project embedding failed:", err.message || err);
  }
}

module.exports = {
  saveFounderProfileEmbeddingByUserId,
  saveInvestorProfileEmbeddingByUserId,
  saveProjectEmbeddingById,
  trySaveFounderEmbedding,
  trySaveInvestorEmbedding,
  trySaveProjectEmbedding,
};

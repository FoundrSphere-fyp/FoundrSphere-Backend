const FounderProfile = require("../models/FounderProfile");
const { cosineSimilarity } = require("../utils/cosineSimilarity");

function overlap(a = [], b = []) {
  const sa = new Set((Array.isArray(a) ? a : []).map((x) => String(x).trim().toLowerCase()).filter(Boolean));
  const sb = new Set((Array.isArray(b) ? b : []).map((x) => String(x).trim().toLowerCase()).filter(Boolean));
  if (!sa.size || !sb.size) return false;
  for (const v of sa) {
    if (sb.has(v)) return true;
  }
  return false;
}

function locationMatches(a, b) {
  if (!a || !b) return false;
  const la = String(a).trim().toLowerCase();
  const lb = String(b).trim().toLowerCase();
  return la === lb || la.includes(lb) || lb.includes(la);
}

function keywordScore(preferenceText, candidateText) {
  if (!preferenceText || !candidateText) return 0;
  const prefs = String(preferenceText)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 4);
  if (!prefs.length) return 0;

  const candidate = String(candidateText).toLowerCase();
  const hitCount = prefs.filter((w) => candidate.includes(w)).length;
  if (!hitCount) return 0;

  const ratio = hitCount / prefs.length;
  return Math.min(0.2, ratio * 0.2);
}

function eqIgnoreCase(a, b) {
  if (!a || !b) return false;
  return String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
}

function includesIgnoreCase(list, value) {
  if (!Array.isArray(list) || !value) return false;
  const needle = String(value).trim().toLowerCase();
  return list.some((item) => String(item).trim().toLowerCase() === needle);
}

/**
 * Rank other founders as cofounder recommendations for a founder.
 * Uses implicit profile signals (no extra preferences required for MVP).
 */
async function recommendCofounders(founderProfile, currentUserId) {
  const me = founderProfile?.toObject ? founderProfile.toObject() : founderProfile || {};
  const allFounders = await FounderProfile.find({
    userId: { $ne: currentUserId },
  }).lean();

  const scored = allFounders.map((candidate) => {
    const rawCosine = cosineSimilarity(me.embedding || [], candidate.embedding || []);
    const normalizedEmbedding = (rawCosine + 1) / 2;

    let score = normalizedEmbedding * 0.45;
    const breakdown = {
      rawCosine,
      normalizedEmbedding,
      embeddingContribution: score,
      industry: 0,
      stage: 0,
      location: 0,
      businessModel: 0,
      role: 0,
      commitment: 0,
      preferenceText: 0,
    };

    if ((me.industries?.length || 0) > 0 && (candidate.industries?.length || 0) > 0) {
      if (overlap(me.industries, candidate.industries)) {
        breakdown.industry = 0.2;
        score += 0.2;
      } else {
        breakdown.industry = -0.05;
        score -= 0.05;
      }
    }

    if (me.stage && candidate.stage) {
      if (String(me.stage).toLowerCase() === String(candidate.stage).toLowerCase()) {
        breakdown.stage = 0.08;
        score += 0.08;
      }
    }

    if (me.location && candidate.location) {
      if (locationMatches(me.location, candidate.location)) {
        breakdown.location = 0.12;
        score += 0.12;
      } else {
        breakdown.location = -0.03;
        score -= 0.03;
      }
    }

    if (me.businessModel && candidate.businessModel) {
      if (String(me.businessModel).trim().toLowerCase() === String(candidate.businessModel).trim().toLowerCase()) {
        breakdown.businessModel = 0.1;
        score += 0.1;
      }
    }

    if (me.desiredCofounderRoles?.length && candidate.founderRole) {
      if (includesIgnoreCase(me.desiredCofounderRoles, candidate.founderRole)) {
        breakdown.role += 0.16;
        score += 0.16;
      } else {
        breakdown.role -= 0.06;
        score -= 0.06;
      }
    }

    if (candidate.desiredCofounderRoles?.length && me.founderRole) {
      if (includesIgnoreCase(candidate.desiredCofounderRoles, me.founderRole)) {
        breakdown.role += 0.12;
        score += 0.12;
      }
    }

    if (me.desiredCommitmentLevel && candidate.commitmentLevel) {
      if (eqIgnoreCase(me.desiredCommitmentLevel, candidate.commitmentLevel)) {
        breakdown.commitment += 0.12;
        score += 0.12;
      } else {
        breakdown.commitment -= 0.06;
        score -= 0.06;
      }
    }

    if (candidate.desiredCommitmentLevel && me.commitmentLevel) {
      if (eqIgnoreCase(candidate.desiredCommitmentLevel, me.commitmentLevel)) {
        breakdown.commitment += 0.08;
        score += 0.08;
      }
    }

    const prefTextBoost = keywordScore(
      me.cofounderPreferenceText,
      [candidate.startupName, candidate.description, candidate.businessModel, candidate.industries?.join(" ")]
        .filter(Boolean)
        .join(" ")
    );
    if (prefTextBoost > 0) {
      breakdown.preferenceText = prefTextBoost;
      score += prefTextBoost;
    }

    return {
      founder: candidate,
      score,
      breakdown,
    };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, 10);
}

module.exports = { recommendCofounders };

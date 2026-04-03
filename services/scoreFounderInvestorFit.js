const { cosineSimilarity } = require("../utils/cosineSimilarity");

/** How much semantic (embedding) vs structured fit matters. */
const EMBEDDING_WEIGHT = 0.45;

function industriesOverlap(founderIndustries, preferredIndustries) {
  const f = Array.isArray(founderIndustries) ? founderIndustries : [];
  const p = Array.isArray(preferredIndustries) ? preferredIndustries : [];
  if (!f.length || !p.length) return false;
  return p.some((i) => f.includes(i));
}

function stageMatches(founderStage, preferredStages) {
  if (!founderStage) return false;
  const stages = Array.isArray(preferredStages) ? preferredStages : [];
  return stages.includes(founderStage);
}

function fundingInRange(fundingNeeded, checkMin, checkMax) {
  if (fundingNeeded === undefined || fundingNeeded === null || fundingNeeded === "") {
    return false;
  }
  const f = Number(fundingNeeded);
  if (Number.isNaN(f)) return false;
  const hasMin = checkMin !== undefined && checkMin !== null && !Number.isNaN(Number(checkMin));
  const hasMax = checkMax !== undefined && checkMax !== null && !Number.isNaN(Number(checkMax));
  if (hasMin && hasMax) return f >= Number(checkMin) && f <= Number(checkMax);
  if (hasMin && !hasMax) return f >= Number(checkMin);
  if (!hasMin && hasMax) return f <= Number(checkMax);
  return false;
}

function hasCheckSizeBounds(inv) {
  const hasMin = inv.checkSizeMin != null && !Number.isNaN(Number(inv.checkSizeMin));
  const hasMax = inv.checkSizeMax != null && !Number.isNaN(Number(inv.checkSizeMax));
  return hasMin || hasMax;
}

function locationMatches(founderLocation, investorLocations) {
  if (!founderLocation || !Array.isArray(investorLocations) || !investorLocations.length) {
    return false;
  }
  const f = String(founderLocation).trim().toLowerCase();
  return investorLocations.some((loc) => {
    const l = String(loc).trim().toLowerCase();
    return l && (l === f || f.includes(l) || l.includes(f));
  });
}

/**
 * Score how well a founder profile fits an investor profile (embedding + structured rules).
 * @param {object} founderProfile - FounderProfile doc or plain object
 * @param {object} investorProfile - InvestorProfile doc or plain object
 * @returns {{ score: number, breakdown: object }}
 */
function scoreFounderInvestorFit(founderProfile, investorProfile) {
  const fp = founderProfile?.toObject ? founderProfile.toObject() : founderProfile || {};
  const inv = investorProfile?.toObject ? investorProfile.toObject() : investorProfile || {};

  const founderEmbedding = Array.isArray(fp.embedding) ? fp.embedding : [];
  const invEmbedding = Array.isArray(inv.embedding) ? inv.embedding : [];
  const founderIndustries = Array.isArray(fp.industries) ? fp.industries : [];
  const founderStage = fp.stage || "";
  const founderLocation = fp.location || "";
  const fundingNeeded = fp.fundingNeeded;
  const founderHasFunding =
    fundingNeeded !== undefined && fundingNeeded !== null && fundingNeeded !== "" && !Number.isNaN(Number(fundingNeeded));

  const rawCosine = cosineSimilarity(founderEmbedding, invEmbedding);
  const normalizedEmbedding = (rawCosine + 1) / 2;
  let score = normalizedEmbedding * EMBEDDING_WEIGHT;

  const breakdown = {
    rawCosine,
    normalizedEmbedding,
    embeddingContribution: score,
    industry: 0,
    stage: 0,
    funding: 0,
    location: 0,
  };

  const prefInd = Array.isArray(inv.preferredIndustries) ? inv.preferredIndustries : [];
  const prefStages = Array.isArray(inv.preferredStages) ? inv.preferredStages : [];

  if (prefInd.length > 0) {
    if (industriesOverlap(founderIndustries, prefInd)) {
      breakdown.industry = 0.12;
      score += 0.12;
    } else {
      breakdown.industry = -0.18;
      score -= 0.18;
    }
  }

  if (prefStages.length > 0) {
    if (stageMatches(founderStage, prefStages)) {
      breakdown.stage = 0.12;
      score += 0.12;
    } else {
      breakdown.stage = -0.18;
      score -= 0.18;
    }
  }

  if (hasCheckSizeBounds(inv) && founderHasFunding) {
    if (fundingInRange(fundingNeeded, inv.checkSizeMin, inv.checkSizeMax)) {
      breakdown.funding = 0.12;
      score += 0.12;
    } else {
      breakdown.funding = -0.22;
      score -= 0.22;
    }
  }

  const locs = Array.isArray(inv.locations) ? inv.locations : [];
  if (locs.length > 0) {
    if (locationMatches(founderLocation, locs)) {
      breakdown.location = 0.05;
      score += 0.05;
    } else {
      breakdown.location = -0.06;
      score -= 0.06;
    }
  }

  return { score, breakdown };
}

module.exports = { scoreFounderInvestorFit, EMBEDDING_WEIGHT };

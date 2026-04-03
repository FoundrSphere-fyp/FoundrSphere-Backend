const InvestorProfile = require("../models/InvestorProfile");
const { scoreFounderInvestorFit } = require("./scoreFounderInvestorFit");

/**
 * Rank investors for a founder (cosine + structured fit vs each investor profile).
 * @param {object} founderProfile
 * @returns {Promise<Array<{ investor: object, score: number, breakdown: object }>>}
 */
async function recommendInvestors(founderProfile) {
  const investors = await InvestorProfile.find({}).lean();

  const scored = investors.map((inv) => {
    const { score, breakdown } = scoreFounderInvestorFit(founderProfile, inv);
    return { investor: inv, score, breakdown };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, 10);
}

module.exports = { recommendInvestors };

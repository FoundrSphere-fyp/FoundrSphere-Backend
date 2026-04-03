const FounderProfile = require("../models/FounderProfile");
const { scoreFounderInvestorFit } = require("./scoreFounderInvestorFit");

/**
 * Rank founders for an investor (same scoring as recommend-investors, roles reversed).
 * @param {object} investorProfile
 * @returns {Promise<Array<{ founder: object, score: number, breakdown: object }>>}
 */
async function recommendFounders(investorProfile) {
  const founders = await FounderProfile.find({}).lean();

  const scored = founders.map((fp) => {
    const { score, breakdown } = scoreFounderInvestorFit(fp, investorProfile);
    return { founder: fp, score, breakdown };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, 10);
}

module.exports = { recommendFounders };

const asyncWrapper = require("../../middleware/async");
const Investment = require("../../models/Investment");

const getInvestmentsByInvestor = asyncWrapper(async (req, res) => {
  const { investorId } = req.params;

  const investments = await Investment.find({
    investorId,
    visibility: { $in: ["public", "amount_hidden"] },
  })
    .populate("projectId")
    .sort({ createdAt: -1 });

  return res.status(200).json({
    type: "success",
    investments,
  });
});

module.exports = getInvestmentsByInvestor;

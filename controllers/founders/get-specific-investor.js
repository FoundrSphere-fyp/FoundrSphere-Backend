const User = require("../../models/User");
const asyncWrapper = require("../../middleware/async");
const Investment = require("../../models/Investment");
const InvestorProfile = require("../../models/InvestorProfile");

const getSpecificInvestor = asyncWrapper(async (req, res) => {
  try {
    const investor = await User.findOne({ _id: req.body.id, userType: "investor" }).select("-password");
    if (!investor) {
      return res.status(404).json({
        type: "error",
        message: "Investor not found.",
      });
    }

    const investorProfile = await InvestorProfile.findOne({ userId: investor._id })
      .select("-embedding")
      .lean();

    const investments = await Investment.find({
      investorId: investor._id,
      visibility: { $in: ["public", "amount_hidden"] },
    })
      .populate({
        path: "projectId",
        populate: {
          path: "ownerId",
          select: "fullName username email userType",
        },
      })
      .sort({ createdAt: -1 });

    const uniqueProjectsMap = new Map();
    investments.forEach((investment) => {
      if (investment.projectId?._id) {
        uniqueProjectsMap.set(String(investment.projectId._id), investment.projectId);
      }
    });
    const investedProjects = Array.from(uniqueProjectsMap.values());

    return res.status(200).json({
      type: "success",
      investor,
      investorProfile,
      investments,
      projects: investedProjects,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      type: "error",
      message: "Error occured while getting investor data, please try again.",
    });
  }
});

module.exports = getSpecificInvestor;
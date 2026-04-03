const User = require("../../models/User");
const asyncWrapper = require("../../middleware/async");
const Project = require("../../models/Project");
const Investment = require("../../models/Investment");
const FounderProfile = require("../../models/FounderProfile");

const getFounders = asyncWrapper(async (req, res) => {
    try {
        const founder = await User.findOne({ _id: req.body.id, userType: "founder" }).select("-password");
        if (!founder) {
            return res.status(404).json({
                type: "error",
                message: "Founder not found."
            });
        }

        const founderProfile = await FounderProfile.findOne({ userId: founder._id })
            .select("-embedding")
            .lean();

        const projects = await Project.find({
            ownerId: founder._id,
            visibility: "public"
        })
            .select("-embedding")
            .sort({ createdAt: -1 })
            .lean();

        const projectIds = projects.map((project) => project._id);
        const investments = await Investment.find({
            projectId: { $in: projectIds },
            visibility: { $in: ["public", "amount_hidden"] }
        })
            .populate("investorId", "fullName username userType")
            .populate("projectId", "title stage")
            .sort({ createdAt: -1 });

        return res.status(200).json({ 
            type: "success", 
            founder,
            founderProfile,
            projects,
            investments
        });

    }
    catch(error) {
        console.log(error)
return res.status(400).json({ 
            type: "error", 
            message: "Error occured while getting founders data, please try again."
        });
    }
});

module.exports = getFounders;
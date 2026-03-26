const User = require("../../models/User");
const asyncWrapper = require("../../middleware/async");
const Project = require("../../models/Project");
const Investment = require("../../models/Investment");


const getFounders = asyncWrapper(async (req, res) => {
    try {
        const founder = await User.findOne({ _id: req.body.id, userType: "founder" }).select("-password");
        if (!founder) {
            return res.status(404).json({
                type: "error",
                message: "Founder not found."
            });
        }

        const projects = await Project.find({
            ownerId: founder._id,
            visibility: "public"
        }).sort({ createdAt: -1 });

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
            founder: founder,
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
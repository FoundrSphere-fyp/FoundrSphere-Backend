const User = require("../../models/User");
const GroupPost = require("../../models/GroupPost");
const asyncWrapper = require("../../middleware/async");

const getDashboardStats = asyncWrapper(async (req, res) => {
    try {
        // Count founders
        const foundersCount = await User.countDocuments({ userType: "founder" });

        // Count investors
        const investorsCount = await User.countDocuments({ userType: "investor" });

        // Count total group posts (treating these as startup evaluations)
        const startupsEvaluated = await GroupPost.countDocuments();

        return res.status(200).json({ 
            type: "success", 
            stats: {
                foundersCount,
                investorsCount,
                startupsEvaluated
            },
            foundersCount,
            investorsCount,
            startupsEvaluated
        });

    }
    catch(error) {
        console.log(error)
        return res.status(400).json({ 
            type: "error", 
            message: "Error occurred while getting dashboard statistics, please try again."
        });
    }
});

module.exports = getDashboardStats;

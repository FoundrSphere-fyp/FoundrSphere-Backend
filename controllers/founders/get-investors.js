const User = require("../../models/User");
const asyncWrapper = require("../../middleware/async");

const getInvestors = asyncWrapper(async (req, res) => {
    try {
        const investors = await User.find({ userType: "investor" }).select("-password");

        return res.status(200).json({ 
            type: "success", 
            investors: investors
        });

    }
    catch(error) {
        console.log(error)
        return res.status(400).json({ 
            type: "error", 
            message: "Error occurred while getting investors data, please try again."
        });
    }
});

module.exports = getInvestors;

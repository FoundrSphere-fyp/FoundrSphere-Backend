const User = require("../../models/User");
const bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
const asyncWrapper = require("../../middleware/async");
const connectDB = require("../../db/connect");
// Helper function to parse user agent


const getFounders = asyncWrapper(async (req, res) => {
    try {
        const founders = await User.find({ userType: "founder" }).select("-password");

        return res.status(200).json({ 
            type: "success", 
            founders: founders
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
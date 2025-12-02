const Group = require("../../models/Group");
const bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
const asyncWrapper = require("../../middleware/async");
const connectDB = require("../../db/connect");
const GroupRequest = require("../../models/GroupRequest");
// Helper function to parse user agent


const leaveGroup = asyncWrapper(async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'No token provided', type: 'error' });
        }

        // Verify JWT token - this will throw an error if token is invalid or expired
        const verification = jwt.verify(token, process.env.JWT_SECRET_KEY);

        let membershipRequest = await GroupRequest.findOne({
            group: req.body.groupId,
            user: verification.userId,
            status: "approved"
        });

        if (!membershipRequest) {
            return res.status(400).json({
                type: "error",
                message: "You are not a member of this group."
            });
        }
        await GroupRequest.deleteOne({ _id: membershipRequest._id });


        return res.status(200).json({
            type: "success",
            message: "You have left the group."
        });
    }
    catch (error) {
        console.log(error)
        return res.status(400).json({
            type: "error",
            message: "Error occured while getting groups data, please try again."
        });
    }

});

module.exports = leaveGroup;
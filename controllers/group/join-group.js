const Group = require("../../models/Group");
const bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
const asyncWrapper = require("../../middleware/async");
const connectDB = require("../../db/connect");
const GroupRequest = require("../../models/GroupRequest");
// Helper function to parse user agent


const joinGroup = asyncWrapper(async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'No token provided', type: 'error' });
        }

        // Verify JWT token - this will throw an error if token is invalid or expired
        const verification = jwt.verify(token, process.env.JWT_SECRET_KEY);

        let group = await Group.findOne({ _id: req.body.groupId });

        if (!group) {
            return res.status(400).json({
                type: "error",
                message: "Group not found."
            })
        }
        let newRequest;
        if (group.visibility == "Public") {
            newRequest = new GroupRequest({
                group: group._id,
                user: verification.userId,
                status: "approved"
            })
        }

        else {
            newRequest = new GroupRequest({
                group: group._id,
                user: verification.userId,
                status: "pending"
            })
        }

        await newRequest.save();

        if (group.visibility == "Public") {
            group.memberCount += 1;
            group.save();
            return res.status(200).json({
                isPublic: true,
                type: "success",
                message: "Group joined, you can now post in this group"
            });
            
        }
        else {
            return res.status(200).json({
                isPublic: false,
                type: "success",
                message: "You will join the group when someone will accept your request."
            });
        }


    }
    catch (error) {
        console.log(error)
        return res.status(400).json({
            type: "error",
            message: "Error occured while getting groups data, please try again."
        });
    }

});

module.exports = joinGroup;
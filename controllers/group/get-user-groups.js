const Group = require("../../models/Group");
const GroupRequest = require("../../models/GroupRequest");
const bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
const asyncWrapper = require("../../middleware/async");
const connectDB = require("../../db/connect");

const getUserGroups = asyncWrapper(async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'No token provided', type: 'error' });
        }
    
        // Verify JWT token
        const verification = jwt.verify(token, process.env.JWT_SECRET_KEY);


        let userGroups = await GroupRequest.find({user: verification.userId, status: "approved"}).populate('group');

        return res.status(200).json({
            message: 'User groups fetched successfully.',
            type: 'success',
            groups: userGroups
        });


    } catch(error) {
        console.log(error);
        return res.status(400).json({ 
            type: "error", 
            message: "Error occurred while checking group membership, please try again."
        });
    }
});

module.exports = getUserGroups;
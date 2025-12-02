const Group = require("../../models/Group");
const GroupRequest = require("../../models/GroupRequest");
const bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
const asyncWrapper = require("../../middleware/async");
const connectDB = require("../../db/connect");

const checkGroupMembership = asyncWrapper(async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'No token provided', type: 'error' });
        }
    
        // Verify JWT token
        const verification = jwt.verify(token, process.env.JWT_SECRET_KEY);

        // Check if user is admin (group creator)
        const isAdmin = await Group.findOne({_id: req.body.groupId, createdBy: verification.userId});
        
        if (isAdmin) {
            return res.status(200).json({ 
                message: 'You are allowed to view the posts as you are the admin of this group.', 
                type: 'success', 
                status: 'admin' 
            });
        }

        // Check if user is a member
        const membershipRequest = await GroupRequest.findOne({
            group: req.body.groupId, 
            user: verification.userId
        });

        if (!membershipRequest) {
            return res.status(403).json({ 
                message: 'You are not allowed to view the content of this group.', 
                type: 'error', 
                status: 'not_joined' 
            });
        }

        if (membershipRequest.status === "pending") {
            return res.status(403).json({ 
                message: 'You can view posts when someone accepts your request to join the group.', 
                type: 'error', 
                status: 'pending' 
            });
        }

        if (membershipRequest.status === "approved") {
            return res.status(200).json({ 
                message: 'You are allowed to view the posts as you are a member of this group.', 
                type: 'success', 
                status: 'approved' 
            });
        }

        // Rejected or any other status
        return res.status(403).json({ 
            message: 'You are not allowed to view the content of this group.', 
            type: 'error', 
            status: 'not_allowed' 
        });

    } catch(error) {
        console.log(error);
        return res.status(400).json({ 
            type: "error", 
            message: "Error occurred while checking group membership, please try again."
        });
    }
});

module.exports = checkGroupMembership;
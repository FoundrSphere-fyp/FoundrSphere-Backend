const Group = require("../../models/Group");
const GroupRequest = require("../../models/GroupRequest");
const bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
const asyncWrapper = require("../../middleware/async");
const connectDB = require("../../db/connect");
// Helper function to parse user agent


const checkGroupMembership = asyncWrapper(async (req, res) => {




    try {

          const token = req.headers.authorization?.split(' ')[1];
            if (!token) {
              return res.status(401).json({ message: 'No token provided', type: 'error' });
            }
        
            // Verify JWT token - this will throw an error if token is invalid or expired
            const verification = jwt.verify(token, process.env.JWT_SECRET_KEY);

            let isMembership = await GroupRequest.findOne({group:req.body.groupId,user: verification.userId});
            if (!isMembership || isMembership.status == "rejected") {
              return res.status(401).json({ message: 'You are not allowed to view the content of this group.', type: 'error', status:"not_joined" });
            }
            else {
                if(isMembership.status == "pending") {
              return res.status(401).json({ message: 'Your can view post when someone accept your request to join the group.', type: 'error', status:"pending" });
                }
                else {
                    return res.status(401).json({ message: 'You are allowed to view the posts as you are a member of this group.', type: 'success', status:"approved" });
                }
            }
    }
    catch(error) {
        console.log(error)
return res.status(400).json({ 
            type: "error", 
            message: "Error occured while getting group posts, please try again."
        });
    }

});

module.exports = checkGroupMembership;
const Group = require("../../models/Group");
const GroupPost = require("../../models/GroupPost");
const bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
const asyncWrapper = require("../../middleware/async");
const connectDB = require("../../db/connect");
// Helper function to parse user agent


const getSingleGroup = asyncWrapper(async (req, res) => {




    try {

          const token = req.headers.authorization?.split(' ')[1];
            if (!token) {
              return res.status(401).json({ message: 'No token provided', type: 'error' });
            }
        
            // Verify JWT token - this will throw an error if token is invalid or expired
            const verification = jwt.verify(token, process.env.JWT_SECRET_KEY);
            
            
     let post = await GroupPost.findOne({_id: req.body.postId})
       .populate("author")
       .populate("eventId")

     return res.status(200).json({ 
            type: "success", 
            post: post
        });
    }
    catch(error) {
        console.log(error)
return res.status(400).json({ 
            type: "error", 
            message: "Error occured while getting group posts, please try again."
        });
    }

});

module.exports = getSingleGroup;
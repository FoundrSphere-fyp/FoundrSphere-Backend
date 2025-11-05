const GroupRequest = require("../../models/GroupRequest");
const bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
const asyncWrapper = require("../../middleware/async");
const connectDB = require("../../db/connect");
// Helper function to parse user agent


const getGroups = asyncWrapper(async (req, res) => {




    try {
    const members = await GroupRequest.find({
      group: req.body.groupId,
      status: "approved"
    }).populate("user", "fullName username");


     return res.status(200).json({ 
            type: "success", 
            members: members
        });
    }
    catch(error) {
        console.log(error)
return res.status(400).json({ 
            type: "error", 
            message: "Error occured while getting group members, please try again."
        });
    }

});

module.exports = getGroups;
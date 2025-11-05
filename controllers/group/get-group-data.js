const Group = require("../../models/Group");
const bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
const asyncWrapper = require("../../middleware/async");
const connectDB = require("../../db/connect");
// Helper function to parse user agent


const getGroupData = asyncWrapper(async (req, res) => {




    try {
     let group = await Group.findOne({_id: req.body.groupId}).populate("createdBy")

     return res.status(200).json({ 
            type: "success", 
            group: group
        });
    }
    catch(error) {
        console.log(error)
return res.status(400).json({ 
            type: "error", 
            message: "Error occured while getting group data, please try again."
        });
    }

});

module.exports = getGroupData;
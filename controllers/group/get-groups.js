const Group = require("../../models/Group");
const bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
const asyncWrapper = require("../../middleware/async");
const connectDB = require("../../db/connect");
// Helper function to parse user agent


const getGroups = asyncWrapper(async (req, res) => {




    try {
     let groups = await Group.find({}).populate("createdBy")

     return res.status(200).json({ 
            type: "success", 
            groups: groups
        });
    }
    catch(error) {
        console.log(error)
return res.status(400).json({ 
            type: "error", 
            message: "Error occured while getting groups data, please try again."
        });
    }

});

module.exports = getGroups;
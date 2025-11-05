const Group = require("../../models/Group");
const bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
const asyncWrapper = require("../../middleware/async");
const connectDB = require("../../db/connect");
// Helper function to parse user agent


const addNewGroup = asyncWrapper(async (req, res) => {


    const rName = req.body.name;
    const rDescription = req.body.description;
    const rIcon = req.body.icon;
    const rVisibility = req.body.visibility;
    const rTopic = req.body.topic;

    if (!rName || !rDescription || !rIcon || !rVisibility || !rTopic) {
        return res.status(400).json({
            type: "error",
            message: "Please fill out all the details"
        })
    }


    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
          return res.status(401).json({ message: 'No token provided', type: 'error' });
        }
    
        // Verify JWT token - this will throw an error if token is invalid or expired
        const verification = jwt.verify(token, process.env.JWT_SECRET_KEY);
        
    let newGroup = new Group({
        name: rName,
        description: rDescription,
        icon: rIcon,
        visibility: rVisibility,
        topic: rTopic,
        createdBy: verification.userId
    });

    await newGroup.save();

     return res.status(200).json({ 
            type: "success", 
            message: "Group Created Successfully", 
            group: newGroup
        });
    }
    catch(error) {
        console.log(error)
return res.status(400).json({ 
            type: "error", 
            message: "Error occured while creating your group, please try again."
        });
    }

});

module.exports = addNewGroup;
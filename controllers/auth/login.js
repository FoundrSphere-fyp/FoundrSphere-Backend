const User = require("../../models/User");
const bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
const asyncWrapper = require("../../middleware/async");
const connectDB = require("../../db/connect");
// Helper function to parse user agent


const login = asyncWrapper(async (req, res) => {


    const rUsername = req.body.username;
    const rPassword = req.body.password;
    
    let user = await User.findOne({ username: rUsername });
    
    if (!user) {
        return res.status(400).json({ 
            message: "The username you entered is not registered", 
            type: "error", 
            field: "username" 
        });
    }
    
    if (user && (await bcrypt.compare(rPassword, user.password))) {
        // Generate JWT token with expiration
        const expirationTime = '1d'; // 1 day
        var token = jwt.sign(
            { userId: user._id, email: user.email }, 
            process.env.JWT_SECRET_KEY, 
            { expiresIn: expirationTime }
        );

      
        const newUser = {
            userId: user._id,
            username: user.username,
            email: user.email,
        };

        return res.status(200).json({ 
            type: "success", 
            message: "You are logged in successfully", 
            token: token, 
            user: newUser 
        });

    } else {
        return res.status(400).json({ 
            message: "The password you entered is incorrect", 
            type: "error", 
            field: "password" 
        });
    }
});

module.exports = login;
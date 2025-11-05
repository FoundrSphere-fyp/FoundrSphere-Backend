const bcrypt = require("bcryptjs");
const asyncWrapper = require("../../middleware/async");

const User = require("../../models/User");



const signup = asyncWrapper(async (req, res) => {

    const { email, username, name, password, userType } = req.body;
    console.log(email, username, name, password, userType);

    if (!email || !username || !name || !password || !userType) {
        return res.status(400).json({ type: "error", message: "Email, name, user type, and password are required." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ type: "error", message: "Valid email is required." });
    }


    const existingUser = await User.findOne({
        $or: [{ email }, { username }]
    });

    if (existingUser) {
        return res.status(400).json({
            type: "error",
            message: existingUser.email === email
                ? "Email already registered."
                : "Username already taken."
        });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    try {


        const user = new User({
            userType,
            email,
            password: hashedPassword,
            fullName: name,
            username
        });

        await user.save();

        return res.status(200).json({ type: "success", message: "User registered successfully." });


    } catch (error) {

        console.error("Error during signup:", error);
        return res.status(500).json({ type: "error", message: "Server error. Please try again later." });
    }
});

module.exports = signup;
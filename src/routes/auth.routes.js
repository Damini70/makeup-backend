const jwt=require("jsonwebtoken");
const bcrypt= require("bcrypt");
const express=require("express");
const app=express();
const cookieParser = require("cookie-parser");
app.use(cookieParser());
const passport=require("passport")

const User = require("../models/User"); 

const router = express.Router();

router.post("/signup",async(req,res)=>{
   const {name,email,mobile_no,password}=req.body;
   try {
      if (!name||!email &&!mobile_no || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Hash password
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds); // 👈 generate salt
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const newUser = new User({
      name,
      email,
      mobile_no,
      password: hashedPassword,
    });

    await newUser.save();
    res.status(201).json({ message: "User created successfully ✅" });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong", error: err.message });
  }
})

router.post("/log-in", async (req, res) => {
  try {
    const { email, mobile_no, password } = req.body;

    // Validate input
    if ((!email && !mobile_no) || !password) {
      return res.status(400).json({ message: "Email or mobile_no and password required" });
    }

    // Find user by email or mobile_no
    const user = await User.findOne({
      $or: [{ email }, { mobile_no }]
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate access token
    const accessToken = jwt.sign(
      { emailId: user.email || user.mobile_no },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    // Generate refresh token
    const refreshToken = jwt.sign(
      { emailId: user.email || user.mobile_no },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

       // Set refresh token in secure HTTP-only cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // true if in production
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({
      message: "Login successful",
      accessToken,
      refreshToken
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    const user = req.user;

    // Create tokens
    const accessToken = jwt.sign(
      { email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { email: user.email },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    // Store refresh token in HTTP-only cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Send accessToken to frontend
    res.redirect(`http://localhost:3000?accessToken=${accessToken}`); // or send as JSON
  }
);

module.exports = router; 
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const nodemailer = require("nodemailer");
const multer = require("multer");
const authenticate = require("../middleware/auth");
const path = require("path");

// Multer setup to save files with original extension and unique name
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // folder to save images
  },
  filename: function (req, file, cb) {
    // Example: profile-1234567890.png
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // max 5MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only image files are allowed!"));
  },
});

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
// Mock recommended courses data for demonstration
const recommendedCourses = [
  { id: "course1", title: "React Basics", description: "Learn React fundamentals" },
  { id: "course2", title: "Node.js API Development", description: "Build REST APIs with Node" },
  { id: "course3", title: "MongoDB Essentials", description: "Master NoSQL databases" },
];

// GET recommended courses for user by id (protected route)
router.get("/:id/recommended-courses", authenticate, async (req, res) => {
  try {
    const userId = req.params.id;

    // You can fetch real data from DB based on user's preferences
    // For now, return the mock array:
    res.status(200).json({ courses: recommendedCourses });
  } catch (error) {
    res.status(500).json({ message: "Failed to get recommended courses" });
  }
});

// Register route
router.post("/:id/update-profile", async (req, res) => {
  try {
    const userId = req.params.id;
    const updateData = req.body; // Accept all fields sent by frontend

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    });

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update profile failed:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});


router.get("/:id", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    const userObj = user.toObject();

    // Remove Buffer checks, just return string
    userObj.profileImage = user.profileImage || null;

    res.status(200).json(userObj);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.get("/test", (req, res) => {
  res.send("API working!");
});
// OTP verification
router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: "User not found" });

  if (user.isVerified)
    return res.status(400).json({ message: "Already verified" });

  if (user.otp !== otp) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  if (user.otpExpires < Date.now()) {
    return res.status(400).json({ message: "OTP expired" });
  }

  user.isVerified = true;
  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save();

  return res.status(200).json({ message: "Email verified successfully!" });
});

router.post("/resend-otp", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 min
    await user.save();

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Your OTP Code (Resent)",
      text: `Your new OTP is: ${otp}`,
    });

    res.status(200).json({ message: "OTP resent successfully!" });
  } catch (err) {
    res.status(500).json({ message: "Failed to resend OTP" });
  }
});

// POST /forgot-password
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) return res.status(404).json({ message: "User not found" });

  const resetOTP = generateOTP();
  user.resetOTP = resetOTP;
  user.resetOTPExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  await user.save();

  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Quiz - test" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: "Password Reset OTP",
    html: `<p>Your password reset OTP is <b>${resetOTP}</b>. It expires in 10 minutes.</p>`,
  });

  res.status(200).json({ message: "OTP sent to your email" });
});

// POST /verify-reset-otp
router.post("/verify-reset-otp", async (req, res) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ email });

  if (!user) return res.status(404).json({ message: "User not found" });
  if (user.resetOTP !== otp)
    return res.status(400).json({ message: "Invalid OTP" });
  if (user.resetOTPExpires < Date.now())
    return res.status(400).json({ message: "OTP expired" });

  res.status(200).json({ message: "OTP verified" });
});

// POST /reset-password
router.post("/reset-password", async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const user = await User.findOne({ email });

  if (!user) return res.status(404).json({ message: "User not found" });
  if (user.resetOTP !== otp)
    return res.status(400).json({ message: "Invalid OTP" });
  if (user.resetOTPExpires < Date.now())
    return res.status(400).json({ message: "OTP expired" });

  {
    /*  const hashedPassword = await bcrypt.hash(newPassword, 10); */
  }
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  user.resetOTP = undefined;
  user.resetOTPExpires = undefined;
  await user.save();

  res.status(200).json({ message: "Password reset successful" });
});

// Login Route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    if (!user.isVerified) {
      return res.status(403).json({ message: "Email not verified" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    // Generate JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;

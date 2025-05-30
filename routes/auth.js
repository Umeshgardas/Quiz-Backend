const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const nodemailer = require("nodemailer");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Register route
router.post("/register", async (req, res) => {
  const { firstName, lastName, email, password, role } = req.body;
  if (
    !firstName?.trim() ||
    !lastName?.trim() ||
    !email?.trim() ||
    !password?.trim()
  ) {
    console.log(firstName);
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "Email already registered" });

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    const user = new User({
      firstName,
      lastName,
      email,
      password,
      otp,
      otpExpires,
      role: role === "admin" ? "admin" : "user",
    });
    await user.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify Your Email",
      html: `<p>Your OTP is <b>${otp}</b>. It expires in 10 minutes.</p>`,
    });

    return res.status(200).json({ message: "OTP sent to email", email });
  } catch (err) {
    console.error("Registration Error:", err);
    return res
      .status(500)
      .json({ message: "Registration error", error: err.message });
  }
});

router.post("/:id/update-profile", upload.single("profileImage"), async (req, res) => {
  try {
    const userId = req.params.id;
    if (req.userId !== userId)
      return res.status(403).json({ message: "Unauthorized" });

    const { firstName, lastName, dob, gender, experience } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (dob) user.dob = dob;
    if (gender) user.gender = gender;
    if (experience) user.experience = experience;

    // Optional: save profile image path if uploaded
    if (req.file) {
      user.profileImage = req.file.path; // you can store filename or full path
    }

    await user.save();

    res.status(200).json({ message: "Profile updated successfully", user });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
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
  user.password = newPassword;
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
      expiresIn: "1h",
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

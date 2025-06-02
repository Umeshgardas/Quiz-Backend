const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  dob: { type: Date },
  gender: { type: String },
  experience: { type: String }, // or Number if you prefer
  profileImage: String,
  email: { type: String, unique: true },
  password: String,
  isVerified: { type: Boolean, default: false },
  otp: String,
  otpExpires: Date,
  resetOTP: String,
  resetOTPExpires: Date,
  role: { type: String, enum: ["user", "admin"], default: "user" },
  profileImage: {
    data: Buffer,
    contentType: String,
  },
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

module.exports = mongoose.model("User", userSchema);

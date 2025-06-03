const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
  title: String,
  description: String,
  link: String,
  subjectCategory: String, // e.g., "MF", "NISM"
});

module.exports = mongoose.model("Course", courseSchema);

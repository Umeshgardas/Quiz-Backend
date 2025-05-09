const mongoose = require("mongoose");

const quizSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String }],
  correctAnswer: { type: String, required: true },
  explanation: { type: String },  // ✅ Add this
  category: { type: String },
  subCategory: { type: String },
  subjectCategory: { type: String },  // ✅ Add this
  topicCategory: { type: String },    // ✅ Add this
});

module.exports = mongoose.model("Quiz", quizSchema);

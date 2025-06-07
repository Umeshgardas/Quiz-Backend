const mongoose = require("mongoose");

const QuizResultSchema = new mongoose.Schema({
   user: String,
  category: { type: String, default: null },
  subCategory: { type: String, default: null },
  subjectCategory: String,
  topicCategory: { type: String, default: null },
  score: Number,
  total: Number,
  answers: Object,
  date: Date,
});

module.exports = mongoose.model("QuizResult", QuizResultSchema);

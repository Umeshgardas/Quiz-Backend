const mongoose = require("mongoose");

const QuizResultSchema = new mongoose.Schema({
  user: {
    type: String, // or use email or userId if available
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  subCategory: {
    type: String,
    required: true,
  },
  subjectCategory: {
    type: String,
    required: true,
  },
  topicCategory: {
    type: String,
    required: true,
  },

  score: Number,
  total: Number,
  answers: Object,
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("QuizResult", QuizResultSchema);

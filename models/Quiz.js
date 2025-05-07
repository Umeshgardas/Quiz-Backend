const { default: mongoose } = require("mongoose");

const quizSchema = new mongoose.Schema({
    question: String,
    options: [String],
    correctAnswer: String,
    category: String,
    subCategory: String
});
module.exports = mongoose.model('Quiz', quizSchema);
const express = require("express");
const router = express.Router();
const Quiz = require("../models/Quiz");
const QuizResult = require("../models/QuizResult");
const { checkQuizStatus } = require("../controllers/quizController");

// Welcome route
router.get("/welcome", (req, res) => {
  res.send("Welcome to the Quiz!");
});

// Check quiz status
router.get("/status/:email/:category/:subCategory", checkQuizStatus);

// Upload a new quiz
router.post("/upload", async (req, res) => {
  const {
    question,
    options,
    correctAnswer,
    explanation,
    category,
    subCategory,
    subjectCategory,
    topicCategory,
  } = req.body;

  try {
    const newQuiz = new Quiz({
      question,
      options,
      correctAnswer,
      explanation,
      category: category.trim(),
      subCategory: subCategory.trim(),
      subjectCategory: subjectCategory.trim(),
      topicCategory: topicCategory.trim(),
    });

    await newQuiz.save();
    res.json({ message: "Quiz uploaded successfully" });
  } catch (err) {
    console.error("Upload Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Fetch quiz by 4 params
router.get("/:category/:subCategory/:subjectCategory/:topicCategory", async (req, res) => {
  try {
    const { category, subCategory, subjectCategory, topicCategory } = req.params;

    const quizzes = await Quiz.find({
      category: new RegExp(`^${category}$`, "i"),
      subCategory: new RegExp(`^${subCategory}$`, "i"),
      subjectCategory: new RegExp(`^${subjectCategory}$`, "i"),
      topicCategory: new RegExp(`^${topicCategory}$`, "i"),
    });

    if (!quizzes.length) {
      return res.status(404).json({ message: "No quiz found." });
    }

    res.json(quizzes);
  } catch (err) {
    console.error("Fetch Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Fetch quiz by 3 params
router.get("/:category/:subCategory/:subjectCategory", async (req, res) => {
  try {
    const { category, subCategory, subjectCategory } = req.params;

    const quizzes = await Quiz.find({
      category: new RegExp(`^${category}$`, "i"),
      subCategory: new RegExp(`^${subCategory}$`, "i"),
      subjectCategory: new RegExp(`^${subjectCategory}$`, "i"),
    });

    if (!quizzes.length) {
      return res.status(404).json({ message: "No quiz found." });
    }

    res.json(quizzes);
  } catch (err) {
    console.error("Fetch Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Fetch quiz by 2 params
router.get("/:category/:subCategory", async (req, res) => {
  try {
    const { category, subCategory } = req.params;

    const quizzes = await Quiz.find({
      category: new RegExp(`^${category}$`, "i"),
      subCategory: new RegExp(`^${subCategory}$`, "i"),
    });

    if (!quizzes.length) {
      return res.status(404).json({ message: "No quiz found." });
    }

    res.json(quizzes);
  } catch (err) {
    console.error("Fetch Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Submit quiz result
router.post("/submit", async (req, res) => {
  try {
    let { user, category, subCategory, score, total, answers } = req.body;

    if (!user || !category || !subCategory || score == null || total == null || !answers) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    category = category.trim();
    subCategory = subCategory.trim();

    const existingResult = await QuizResult.findOne({ user, category, subCategory });

    if (existingResult) {
      return res.status(409).json({ message: "Quiz already submitted." });
    }

    const newResult = new QuizResult({
      user,
      category,
      subCategory,
      score,
      total,
      answers,
      date: new Date(),
    });

    await newResult.save();
    res.status(200).json({ message: "Quiz result saved successfully." });
  } catch (err) {
    console.error("Error saving quiz result:", err);
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;

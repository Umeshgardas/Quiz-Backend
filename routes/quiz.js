const express = require("express");
const router = express.Router();
const Quiz = require("../models/Quiz");
const QuizResult = require("../models/QuizResult");
const { checkQuizStatus } = require("../controllers/quizController");

// Welcome route
router.get("/welcome", (req, res) => {
  res.send("Welcome to the Quiz!");
});
// GET /api/quiz/all - Get all quizzes
router.get("/all", async (req, res) => {
  try {
    const quizzes = await Quiz.find({});
    res.status(200).json(quizzes);
  } catch (err) {
    console.error("Error fetching all quizzes:", err);
    res.status(500).json({ message: "Server error while fetching quizzes." });
  }
});

// DELETE /api/quiz/:id
router.delete("/:id", async (req, res) => {
  try {
    await Quiz.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Quiz deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting quiz" });
  }
});

// PUT /api/quiz/:id
router.put("/:id", async (req, res) => {
  try {
    const updatedQuiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.status(200).json(updatedQuiz);
  } catch (err) {
    res.status(500).json({ message: "Error updating quiz" });
  }
});

module.exports = router;
router.get("/history/:userEmail", async (req, res) => {
  try {
    const history = await QuizResult.find({ user: req.params.userEmail }).sort({
      date: -1,
    });
    res.json(history);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching quiz history" });
  }
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
router.get(
  "/:category/:subCategory/:subjectCategory/:topicCategory",
  async (req, res) => {
    try {
      const { category, subCategory, subjectCategory, topicCategory } =
        req.params;

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
  }
);

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
// GET /api/quiz/topic/:topicCategory
router.get("/topic/:topicCategory", async (req, res) => {
  try {
    const topicCategory = req.params.topicCategory.trim();

    // Find quizzes matching only the topicCategory (case-insensitive)
    const quizzes = await Quiz.find({
      topicCategory: new RegExp(`^${topicCategory}$`, "i"),
    });

    if (!quizzes.length) {
      return res
        .status(404)
        .json({ message: "No quiz found for this topic category." });
    }

    res.json(quizzes);
  } catch (err) {
    console.error("Fetch Error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    console.log("GET /api/quiz endpoint hit");
    console.log("Query params:", req.query);
    const { subjectCategory, topicCategory } = req.query;
    if (!subjectCategory) {
      return res.status(400).json({ message: "subjectCategory is required" });
    }

    let query = {
      subjectCategory: new RegExp(`^${subjectCategory}$`, "i"),
    };

    if (topicCategory) {
      query.topicCategory = new RegExp(`^${topicCategory}$`, "i");
    }

    const quizzes = await Quiz.find(query);

    if (!quizzes.length) {
      return res.status(404).json({ message: "No quiz found." });
    }

    res.json(quizzes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Submit quiz result
router.post("/submit", async (req, res) => {
  try {
    let {
      user,
      category,
      subCategory,
      subjectCategory,
      topicCategory,
      score,
      total,
      answers,
    } = req.body;

    console.log("Incoming payload:", req.body); // Log the full payload

    // Validate required fields based on request type
    const isPage1 = category && subCategory;
    const isPage2 = subjectCategory && !category && !subCategory;

    if (
      !user ||
      !subjectCategory ||
      score == null ||
      total == null ||
      !answers
    ) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const newResult = new QuizResult({
      user,
      category: category?.trim() || null,
      subCategory: subCategory?.trim() || null,
      subjectCategory: subjectCategory.trim(),
      topicCategory: topicCategory?.trim() || null,
      score,
      total,
      answers,
      date: new Date(),
    });

    await newResult.save();

    return res.status(200).json({ message: "Quiz result saved successfully." });
  } catch (err) {
    console.error("Error saving quiz result:", err); // Print full error
    return res.status(500).json({ message: "Server error." });
  }
});



module.exports = router;
const handleClick = (subject) => {
  navigate(`/courses/${subject}`);
};

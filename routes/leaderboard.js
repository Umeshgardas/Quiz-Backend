const express = require("express");
const router = express.Router();
const QuizResult = require("../models/QuizResult");

// GET /api/leaderboard
router.get("/", async (req, res) => {
  try {
    // Get top 10 scores, grouped by user
    const topResults = await QuizResult.aggregate([
      {
        $group: {
          _id: "$user",
          highestScore: { $max: "$score" },
          totalQuizzes: { $sum: 1 },
        },
      },
      {
        $sort: { highestScore: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    res.json(topResults);
  } catch (error) {
    console.error("Leaderboard error:", error);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

module.exports = router;

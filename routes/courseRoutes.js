const express = require("express");
const router = express.Router();
const Course = require("../models/Course");

// Get recommended courses by subject category
router.get("/:subjectCategory", async (req, res) => {
  try {
    const subjectCategory = req.params.subjectCategory.trim();
    const courses = await Course.find({
      subjectCategory: new RegExp(`^${subjectCategory}$`, "i"),
    });

    if (!courses.length) {
      return res.status(404).json({ message: "No courses found." });
    }

    res.status(200).json(courses);
  } catch (err) {
    console.error("Error fetching courses:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

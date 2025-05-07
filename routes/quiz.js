const express = require('express');
const router = express.Router();
const Quiz = require('../models/Quiz');
const QuizResult = require('../models/QuizResult');
const { checkQuizStatus } = require('../controllers/quizController'); // import properly

// Create new quiz
router.post('/upload', async (req, res) => {
    const { question, options, correctAnswer, category, subCategory } = req.body;

    try {
        const newQuiz = new Quiz({
            question,
            options,
            correctAnswer,
            category: category.trim(),
            subCategory: subCategory.trim()
        });

        await newQuiz.save();
        res.json({ message: 'Quiz uploaded successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.get("/welcome", (req, res) => {
    res.send("Welcome to the Quiz!");
  });
// Get quiz by category and subcategory
router.get('/:category/:subCategory', async (req, res) => {
    try {
        const { category, subCategory } = req.params;

        const quizzes = await Quiz.find({
            category: new RegExp(`^${category}$`, 'i'),
            subCategory: new RegExp(`^${subCategory}$`, 'i')
        });

        if (quizzes.length === 0) {
            return res.status(404).json({ message: 'No quiz found for this category and subcategory' });
        }

        res.json(quizzes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Post quiz submission
router.post('/submit', async (req, res) => {
    try {
        let { user, category, subCategory, score, total, answers } = req.body;

        // Log incoming data
        console.log("Received submission:", req.body);

        // Basic field validation
        if (!user || !category || !subCategory || score == null || total == null || !answers) {
            return res.status(400).json({ message: 'Missing required fields.' });
        }

        // Trim category/subCategory
        category = category.trim();
        subCategory = subCategory.trim();

        // Check if quiz already submitted
        const existingResult = await QuizResult.findOne({ user, category, subCategory });

        if (existingResult) {
            return res.status(409).json({ message: 'Quiz already submitted for this category and subcategory.' });
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
        res.status(200).json({ message: 'Quiz result saved successfully.' });

    } catch (err) {
        console.error('Error saving quiz result:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});


router.get('/status/:email/:category/:subCategory', checkQuizStatus);


module.exports = router;

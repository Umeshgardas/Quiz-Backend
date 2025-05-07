const QuizResult = require('../models/QuizResult'); // Fix: use QuizResult model

exports.checkQuizStatus = async (req, res) => {
    const { email, category, subCategory } = req.params;

    try {
        const quizResult = await QuizResult.findOne({
            user: email,
            category,
            subCategory,
        });

        if (quizResult) {
            return res.json({ quizTaken: true });
        } else {
            return res.json({ quizTaken: false });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
    }
};

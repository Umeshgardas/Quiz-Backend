const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Define allowed origins
const allowedOrigins = [
  'http://localhost:5173',
  'https://quiz-backend-mn2m.onrender.com',
];

// CORS middleware setup
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// Enable preflight across-the-board
app.options('*', cors(corsOptions));

// Parse incoming JSON
app.use(express.json());

// Connect MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

// Routes
const authRoutes = require("./routes/auth");
const quizRoutes = require("./routes/quiz");

app.use("/api/auth", authRoutes);
app.use("/api/quiz", quizRoutes);

// Test endpoint
app.get("/welcome", (req, res) => {
  res.send("Welcome to the backend!");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

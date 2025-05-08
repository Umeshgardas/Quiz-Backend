const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
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
app.get("/welcome", (req, res) => {
    res.send("Welcome to the backend!");
  });
  

app.listen(process.env.PORT, () => console.log("Server started on port 5000"));

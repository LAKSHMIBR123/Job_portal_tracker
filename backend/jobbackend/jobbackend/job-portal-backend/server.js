const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./src/config/db");
const authRoutes = require("./src/routes/auth.routes");
const userRoutes = require("./src/routes/user.routes");
const jobRoutes = require("./src/routes/job.routes");
const applicationRoutes = require("./src/routes/application.routes");
const testRoutes = require("./src/routes/test.routes");
const notificationRoutes = require("./src/routes/notification.routes");
const cors = require("cors");
const errorHandler = require("./src/middlewares/error.middleware");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: true, // Allow all origins for local dev, or you can pass the array
  credentials: true,
}));

app.use(express.json());

app.get("/api", (req, res) => {
  res.json({
    success: true,
    message: "API is running...",
    port: PORT,
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/notifications", notificationRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "API is running...",
    apiBaseUrl: `http://localhost:${PORT}/api`,
  });
});

app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();

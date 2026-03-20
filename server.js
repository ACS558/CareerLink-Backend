import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./src/config/database.js";
import routes from "./src/routes/index.js";
import { initializeCronJobs } from "./src/config/cronJobs.js";
import { initializeSocket } from "./src/socket/socketServer.js";
import http from "http";

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const server = http.createServer(app);

// Connect to MongoDB
connectDB();

initializeCronJobs();

// CORS Configuration
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:5174",
  "https://career-link-frontend-henna.vercel.app", // Add your Vercel URL explicitly
  process.env.FRONTEND_URL,
].filter(Boolean); // Remove undefined values

// Log CORS origins on startup
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("🔒 CORS Configuration:");
console.log("   Allowed Origins:", allowedOrigins);
console.log("   FRONTEND_URL env:", process.env.FRONTEND_URL || "NOT SET");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, Postman, curl)
      if (!origin) {
        console.log("✅ Allowing request with no origin");
        return callback(null, true);
      }

      if (allowedOrigins.indexOf(origin) !== -1) {
        console.log("✅ CORS allowed for origin:", origin);
        callback(null, true);
      } else {
        console.error("❌ CORS BLOCKED for origin:", origin);
        console.error("   Allowed origins:", allowedOrigins);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const io = initializeSocket(server);
app.set("io", io);

// Request logging middleware
app.use((req, res, next) => {
  console.log(
    `${req.method} ${req.path} - Origin: ${req.get("origin") || "none"}`,
  );
  next();
});

// Mount API routes
app.use("/api", routes);

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to CareerLink API",
    version: "1.0.0",
    environment: process.env.NODE_ENV,
    frontendUrl: process.env.FRONTEND_URL,
    endpoints: {
      health: "/health",
      api: "/api",
    },
  });
});

// Health check route
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    corsOrigins: allowedOrigins,
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.message);
  res.status(500).json({
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

// Start server
const PORT = process.env.PORT || 5000;

server.listen(PORT, "0.0.0.0", () => {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`📊 API Base URL: http://localhost:${PORT}/api`);
  console.log(`🌍 Frontend URL: ${process.env.FRONTEND_URL || "NOT SET"}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
});

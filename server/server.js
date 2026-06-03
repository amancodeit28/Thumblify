import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import thumbnailRoutes from "./routes/thumbnails.js";

// Load Environment Configuration
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Setup directories
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "public/uploads");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Static Uploads
app.use("/uploads", express.static(uploadsDir));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/thumbnails", thumbnailRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
    res.json({ status: "ok", message: "Thumblify API is running smoothly" });
});

// Custom 404 Route handler
app.use((req, res, next) => {
    res.status(404).json({ message: `Route not found - ${req.originalUrl}` });
});

// Global Error Handler
app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({
        message: err.message,
        stack: process.env.NODE_ENV === "production" ? null : err.stack,
    });
});

// Export app for serverless environments (Vercel)
export default app;

app.listen(PORT, () => {
    console.log(`Server running in development mode on http://localhost:${PORT}`);
});

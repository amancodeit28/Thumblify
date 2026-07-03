import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import thumbnailRoutes from "./routes/thumbnails.js";
import folderRoutes from "./routes/folders.js";
import billingRoutes from "./routes/billing.js";

// Load Environment Configuration
dotenv.config();

// Connect to MongoDB
connectDB().catch(err => console.error("MongoDB connection error:", err.message));

const app = express();
const PORT = process.env.PORT || 5000;

// Setup directories (skip on Vercel where filesystem is read-only)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "public/uploads");
if (!process.env.VERCEL) {
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }
}

// Middleware
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);
        // Allow any localhost/127.0.0.1 origin on any port
        if (origin.match(/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/)) {
            return callback(null, true);
        }
        // Allow Vercel deployed frontend
        if (origin.match(/\.vercel\.app$/)) {
            return callback(null, true);
        }
        callback(null, true); // Allow all for development
    },
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Static Uploads
app.use("/uploads", express.static(uploadsDir));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/thumbnails", thumbnailRoutes);
app.use("/api/folders", folderRoutes);
app.use("/api/billing", billingRoutes);

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

// Only start the server when running locally (not in Vercel serverless)
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Server running in development mode on http://localhost:${PORT}`);
    });
}

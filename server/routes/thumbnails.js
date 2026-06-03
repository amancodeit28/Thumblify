import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Thumbnail from "../models/Thumbnail.js";
import { protect } from "../middleware/auth.js";
import { v2 as cloudinary } from "cloudinary";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Style mapping from prompts-for-backend.txt
const stylePrompts = {
    "Bold & Graphic": "eye-catching thumbnail, bold typography, vibrant colors, expressive facial reaction, dramatic lighting, high contrast, click-worthy composition, professional style",
    "Tech/Futuristic": "futuristic thumbnail, sleek modern design, digital UI elements, glowing accents, holographic effects, cyber-tech aesthetic, sharp lighting, high-tech atmosphere",
    "Minimalist": "minimalist thumbnail, clean layout, simple shapes, limited color palette, plenty of negative space, modern flat design, clear focal point",
    "Photorealistic": "photorealistic thumbnail, ultra-realistic lighting, natural skin tones, candid moment, DSLR-style photography, lifestyle realism, shallow depth of field",
    "Illustrated": "illustrated thumbnail, custom digital illustration, stylized characters, bold outlines, vibrant colors, creative cartoon or vector art style",
};

// Color scheme mapping from prompts-for-backend.txt
const colorSchemeDescriptions = {
    vibrant: "vibrant and energetic colors, high saturation, bold contrasts, eye-catching palette",
    sunset: "warm sunset tones, orange pink and purple hues, soft gradients, cinematic glow",
    forest: "natural green tones, earthy colors, calm and organic palette, fresh atmosphere",
    neon: "neon glow effects, electric blues and pinks, cyberpunk lighting, high contrast glow",
    purple: "purple-dominant color palette, magenta and violet tones, modern and stylish mood",
    monochrome: "black and white color scheme, high contrast, dramatic lighting, timeless aesthetic",
    ocean: "cool blue and teal tones, aquatic color palette, fresh and clean atmosphere",
    pastel: "soft pastel colors, low saturation, gentle tones, calm and friendly aesthetic",
};

// @desc    Generate a new thumbnail
// @route   POST /api/thumbnails/generate
// @access  Private
router.post("/generate", protect, async (req, res) => {
    const { title, style, aspect_ratio, color_scheme, text_overlay, additionalDetails } = req.body;

    if (!title || !style) {
        return res.status(400).json({ message: "Title and Style are required" });
    }

    try {
        // 1. Construct prompt context
        const styleText = stylePrompts[style] || style;
        const colorText = colorSchemeDescriptions[color_scheme] || "";
        const detailsText = additionalDetails ? `Additional requirements: ${additionalDetails}` : "";
        const overlayText = text_overlay 
            ? `Design the image layout with a specific clean area suited for a bold text overlay reading "${title}".` 
            : `Do not add letters, words or text overlays on the image background itself.`;

        const systemPrompt = `You are a professional YouTube thumbnail designer. Refine the following user idea into a highly descriptive image generation prompt (approx. 50-70 words) for a state-of-the-art text-to-image AI (like Stable Diffusion or Imagen). 
Create a high-impact, visual concept that has a high Click-Through Rate (CTR).
Parameters:
- Subject/Title: ${title}
- Style: ${styleText}
- Color scheme/vibe: ${colorText}
- Layout: ${overlayText}
- ${detailsText}

Respond ONLY with the final optimized image prompt text. Do not include introductory text, markdown formatting, quotes, or code blocks.`;

        // 2. Expand prompt using Gemini API (with safety check/fallback)
        let expandedPrompt = "";
        const apiKey = process.env.GEMINI_API_KEY;
        const hasValidKey = apiKey && apiKey !== "YOUR_GEMINI_API_KEY_HERE" && apiKey.trim() !== "";

        if (hasValidKey) {
            try {
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                const result = await model.generateContent(systemPrompt);
                expandedPrompt = result.response.text().trim();
            } catch (geminiError) {
                console.error("Gemini API generation failed, falling back to local builder:", geminiError);
            }
        }

        // Local fallback builder if API key is missing or failed
        if (!expandedPrompt) {
            expandedPrompt = `${styleText}. ${colorText}. Subject of the thumbnail: ${title}. ${detailsText}. High quality, detailed 4k resolution YouTube thumbnail layout, ${overlayText}`;
        }

        // 3. Determine image dimensions based on aspect ratio
        let width = 1280;
        let height = 720;
        if (aspect_ratio === "1:1") {
            width = 1080;
            height = 1080;
        } else if (aspect_ratio === "9:16") {
            width = 720;
            height = 1280;
        }

        const seed = Math.floor(Math.random() * 1000000);
        // We will call Pollinations AI which provides a reliable free image generation service
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(expandedPrompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true&private=true`;

        // 4. Download and save the image (Local / Cloudinary)
        let storedUrl = "";
        const hasCloudinary = process.env.CLOUDINARY_CLOUD_NAME && 
                            process.env.CLOUDINARY_API_KEY && 
                            process.env.CLOUDINARY_API_SECRET;

        if (hasCloudinary) {
            try {
                // Configure cloudinary dynamically from environment variables
                cloudinary.config({
                    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
                    api_key: process.env.CLOUDINARY_API_KEY,
                    api_secret: process.env.CLOUDINARY_API_SECRET,
                });

                // Cloudinary uploader can download directly from a secure URL
                const uploadResult = await cloudinary.uploader.upload(imageUrl, {
                    folder: "thumblify",
                });
                storedUrl = uploadResult.secure_url;
            } catch (cloudinaryError) {
                console.error("Cloudinary upload failed, falling back to local storage:", cloudinaryError);
            }
        }

        // Fallback to local storage if Cloudinary is not configured or failed
        if (!storedUrl) {
            const response = await axios({
                method: "get",
                url: imageUrl,
                responseType: "arraybuffer",
                timeout: 25000 // 25 seconds timeout
            });

            // Ensure uploads directory exists
            const uploadsDir = path.join(__dirname, "../public/uploads");
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }

            const filename = `thumb-${Date.now()}-${Math.floor(Math.random() * 1000)}.jpg`;
            const localPath = path.join(uploadsDir, filename);
            fs.writeFileSync(localPath, response.data);

            // Store relative URL for database
            storedUrl = `/uploads/${filename}`;
        }

        // 5. Create DB Record
        const thumbnail = await Thumbnail.create({
            userId: req.user._id,
            title,
            style,
            aspect_ratio,
            color_scheme,
            text_overlay: !!text_overlay,
            image_url: storedUrl,
            prompt_used: expandedPrompt,
            user_prompt: additionalDetails,
        });

        res.status(201).json(thumbnail);
    } catch (error) {
        console.error("Generation failed:", error);
        res.status(500).json({ message: "Failed to generate thumbnail. " + error.message });
    }
});

// @desc    Get user's generations
// @route   GET /api/thumbnails/my-generations
// @access  Private
router.get("/my-generations", protect, async (req, res) => {
    try {
        const thumbnails = await Thumbnail.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.json(thumbnails);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get single generation
// @route   GET /api/thumbnails/:id
// @access  Private
router.get("/:id", protect, async (req, res) => {
    try {
        const thumbnail = await Thumbnail.findById(req.params.id);

        if (!thumbnail) {
            return res.status(404).json({ message: "Thumbnail not found" });
        }

        if (thumbnail.userId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: "Not authorized" });
        }

        res.json(thumbnail);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete generation
// @route   DELETE /api/thumbnails/:id
// @access  Private
router.delete("/:id", protect, async (req, res) => {
    try {
        const thumbnail = await Thumbnail.findById(req.params.id);

        if (!thumbnail) {
            return res.status(404).json({ message: "Thumbnail not found" });
        }

        if (thumbnail.userId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: "Not authorized" });
        }

        // Remove file from storage if it exists (Local / Cloudinary)
        if (thumbnail.image_url.startsWith("http")) {
            const hasCloudinary = process.env.CLOUDINARY_CLOUD_NAME && 
                                process.env.CLOUDINARY_API_KEY && 
                                process.env.CLOUDINARY_API_SECRET;
            if (hasCloudinary) {
                try {
                    cloudinary.config({
                        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
                        api_key: process.env.CLOUDINARY_API_KEY,
                        api_secret: process.env.CLOUDINARY_API_SECRET,
                    });
                    
                    const parts = thumbnail.image_url.split("/");
                    const folderIdx = parts.indexOf("thumblify");
                    if (folderIdx !== -1) {
                        const filenameWithExt = parts.slice(folderIdx).join("/");
                        const publicId = filenameWithExt.substring(0, filenameWithExt.lastIndexOf("."));
                        await cloudinary.uploader.destroy(publicId);
                    }
                } catch (cloudinaryDelError) {
                    console.error("Failed to delete image from Cloudinary:", cloudinaryDelError);
                }
            }
        } else {
            const filename = path.basename(thumbnail.image_url);
            const filePath = path.join(__dirname, "../public/uploads", filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await thumbnail.deleteOne();
        res.json({ message: "Thumbnail removed successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;

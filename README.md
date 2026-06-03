# 🎬 Thumblify - Full-Stack AI YouTube Thumbnail Generator

Thumblify is a premium, full-stack AI-powered YouTube thumbnail generator. It refines your basic ideas into high-converting, click-worthy prompts using **Google Gemini AI**, generates stunning thumbnails, and lets you preview how they look inside a live YouTube interface.

---

## ✨ Features

- **🔐 User Authentication**: Secure Register, Login, and persistent sessions using JWT and hashed passwords.
- **🎨 Interactive Visual Studio**:
  - Custom Title and Prompt Details inputs.
  - Aspect Ratio controller (**16:9** standard, **1:1** square, **9:16** shorts).
  - 5 Design Style presets (Bold & Graphic, Tech/Futuristic, Minimalist, Photorealistic, Illustrated).
  - Dynamic Color Palette swatches.
  - Spacing option for text overlay.
- **🤖 Gemini Prompt Booster**: Leverages Google Gemini API to analyze user parameters and write optimized, high-CTR image prompts.
- **☁️ Hybrid Image Storage**: Automatically saves images to Cloudinary in production, or falls back to server local disk storage in development.
- **📺 YouTube Simulation Preview**: View how your generated thumbnail looks inside a real YouTube home feed simulation.
- **📂 Personal Generations Gallery**: Retain, view, download, preview, or delete your past generated masterpieces.

---

## 🛠️ Tech Stack

**Frontend:**
- React JS (Vite)
- Tailwind CSS v4
- Framer Motion & Lenis Smooth Scroll
- Lucide React Icons

**Backend:**
- Node.js & Express
- MongoDB & Mongoose
- Google Gemini AI SDK (`@google/generative-ai`)
- Cloudinary SDK
- Axios

---

## 🚀 How to Run Locally

### 1. Configure Backend Variables
Create a `.env` file inside the `/server` folder:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/thumblify
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

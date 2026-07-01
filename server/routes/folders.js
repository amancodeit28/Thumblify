import express from "express";
import Folder from "../models/Folder.js";
import Thumbnail from "../models/Thumbnail.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// @desc    Get all folders for logged-in user
// @route   GET /api/folders
// @access  Private
router.get("/", protect, async (req, res) => {
    try {
        const folders = await Folder.find({ userId: req.user._id }).sort({ name: 1 });
        res.json(folders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create a new folder
// @route   POST /api/folders
// @access  Private
router.post("/", protect, async (req, res) => {
    const { name } = req.body;

    if (!name || name.trim() === "") {
        return res.status(400).json({ message: "Folder name is required" });
    }

    try {
        const folderExists = await Folder.findOne({ userId: req.user._id, name: name.trim() });
        if (folderExists) {
            return res.status(400).json({ message: "Folder with this name already exists" });
        }

        const folder = await Folder.create({
            userId: req.user._id,
            name: name.trim(),
        });

        res.status(201).json(folder);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete a folder
// @route   DELETE /api/folders/:id
// @access  Private
router.delete("/:id", protect, async (req, res) => {
    try {
        const folder = await Folder.findById(req.params.id);

        if (!folder) {
            return res.status(404).json({ message: "Folder not found" });
        }

        if (folder.userId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: "Not authorized" });
        }

        // Dissociate thumbnails from this folder before deleting it
        await Thumbnail.updateMany(
            { userId: req.user._id, folderId: folder._id },
            { $set: { folderId: null } }
        );

        await folder.deleteOne();
        res.json({ message: "Folder deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;

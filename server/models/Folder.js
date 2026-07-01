import mongoose from "mongoose";

const FolderSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        name: {
            type: String,
            required: [true, "Folder name is required"],
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

// Ensure a user cannot have two folders with the exact same name
FolderSchema.index({ userId: 1, name: 1 }, { unique: true });

const Folder = mongoose.model("Folder", FolderSchema);
export default Folder;

import mongoose from "mongoose";

let isConnected = false;

const connectDB = async () => {
    if (isConnected || mongoose.connection.readyState >= 1) {
        isConnected = true;
        return;
    }
    
    try {
        if (!process.env.MONGO_URI) {
            console.error("MONGO_URI environment variable is not set");
            return;
        }
        const conn = await mongoose.connect(process.env.MONGO_URI);
        isConnected = true;
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        // Don't exit or throw in serverless — let routes handle the error
        if (!process.env.VERCEL) {
            process.exit(1);
        }
    }
};

export default connectDB;

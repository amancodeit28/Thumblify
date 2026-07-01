import express from "express";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// @desc    Simulate plan purchase checkout
// @route   POST /api/billing/checkout
// @access  Private
router.post("/checkout", protect, async (req, res) => {
    const { planName } = req.body;

    const validPlans = ["Basic", "Pro", "Enterprise"];
    if (!planName || !validPlans.includes(planName)) {
        return res.status(400).json({ message: "Invalid plan name" });
    }

    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Apply plan logic
        user.plan = planName;

        if (planName === "Basic") {
            // Adds 50 credits to their balance
            user.credits = (user.credits || 0) + 50;
        } else {
            // Pro & Enterprise get unlimited, we can reset credits or just set it high
            // The generate logic will bypass checking/decrementing credits for Pro/Enterprise plans.
            user.credits = 9999;
        }

        await user.save();

        res.json({
            message: `Successfully upgraded to the ${planName} plan!`,
            plan: user.plan,
            credits: user.credits,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;

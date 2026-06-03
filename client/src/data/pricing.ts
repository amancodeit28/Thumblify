import type { IPricing } from "../types";

export const pricingData: IPricing[] = [
    {
        name: "Basic",
        price: 29,
        period: "month",
        features: [
            "50 AI Thumbnail generations",
            "Access to basic courses",
            "No Watermark",
            "Standard Resultion",
            "Email support"
        ],
        mostPopular: false
    },
    {
        name: "Pro",
        price: 79,
        period: "month",
        features: [
            "Unlimited AI Thumbnail generations",
            "Premium Templates",
            "4K Resultion",
            "A/B Testing tools",
            "Custom Fonts and Branding",
            "Brand Kit Analysis",
            "Priority Email Support"
        ],
        mostPopular: true
    },
    {
        name: "Enterprise",
        price: 199,
        period: "month",
        features: [
            "Everything in Pro",
            "API Access",
            "Team Collaboration",
            "Dedicated Account Manager",
            "Custom Branding Templates"
        ],
        mostPopular: false
    }
];
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckIcon, CreditCard, Lock, CheckCircle2, X, AlertCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SectionTitle from "../components/SectionTitle";
import { pricingData } from "../data/pricing";
import type { IPricing } from "../types";
import { useAuth, API_BASE_URL } from "../context/AuthContext";

export default function PricingSection() {
    const navigate = useNavigate();
    const { user, token, refreshUser } = useAuth();
    
    // Payment Modal States
    const [selectedPlan, setSelectedPlan] = useState<IPricing | null>(null);
    const [paying, setPaying] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [paymentError, setPaymentError] = useState<string | null>(null);

    // Card Input States
    const [cardNumber, setCardNumber] = useState("");
    const [cardName, setCardName] = useState("");
    const [cardExpiry, setCardExpiry] = useState("");
    const [cardCvc, setCardCvc] = useState("");

    const handlePlanClick = (plan: IPricing) => {
        if (!token) {
            navigate("/login");
            return;
        }
        setSelectedPlan(plan);
        setPaymentSuccess(false);
        setPaymentError(null);
        setCardNumber("");
        setCardName(user?.name || "");
        setCardExpiry("");
        setCardCvc("");
    };

    const handlePaymentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Simple card formatting validation
        if (cardNumber.replace(/\s/g, "").length < 16) {
            setPaymentError("Please enter a valid 16-digit card number");
            return;
        }
        if (cardExpiry.length < 5 || !cardExpiry.includes("/")) {
            setPaymentError("Please enter expiry date (MM/YY)");
            return;
        }
        if (cardCvc.length < 3) {
            setPaymentError("Please enter a valid 3-digit CVC");
            return;
        }

        setPaying(true);
        setPaymentError(null);

        try {
            const response = await fetch(`${API_BASE_URL}/billing/checkout`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    planName: selectedPlan?.name,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Checkout failed");
            }

            // Sync user plan and credit indicators in context
            await refreshUser();
            setPaymentSuccess(true);
            setTimeout(() => {
                setSelectedPlan(null);
                setPaymentSuccess(false);
            }, 2500);
        } catch (err: any) {
            setPaymentError(err.message || "An error occurred during payment processing");
        } finally {
            setPaying(false);
        }
    };

    // Format card number to groups of 4 digits
    const handleCardNumberChange = (value: string) => {
        const cleaned = value.replace(/\D/g, "").substring(0, 16);
        const formatted = cleaned.match(/.{1,4}/g)?.join(" ") || cleaned;
        setCardNumber(formatted);
    };

    // Format expiry to MM/YY
    const handleExpiryChange = (value: string) => {
        const cleaned = value.replace(/\D/g, "").substring(0, 4);
        if (cleaned.length >= 2) {
            setCardExpiry(`${cleaned.substring(0, 2)}/${cleaned.substring(2)}`);
        } else {
            setCardExpiry(cleaned);
        }
    };

    return (
        <div id="pricing" className="px-4 md:px-16 lg:px-24 xl:px-32 relative py-12">
            <SectionTitle text1="Pricing" text2="Our Pricing Plans" text3="Choose the plan that fits your creation schedule. Cancel Anytime." />

            <div className="flex flex-wrap items-center justify-center gap-8 mt-20">
                {pricingData.map((plan: IPricing, index: number) => (
                    <motion.div 
                        key={index} 
                        className={`w-72 text-left border border-pink-950 p-6 pb-12 rounded-2xl flex flex-col justify-between min-h-[460px] ${
                            plan.mostPopular ? 'bg-pink-950/40 border-pink-500/50 relative shadow-2xl shadow-pink-500/5' : 'bg-pink-950/15'
                        }`}
                        initial={{ y: 80, opacity: 0 }}
                        whileInView={{ y: 0, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.15, type: "spring", stiffness: 200, damping: 25 }}
                    >
                        {plan.mostPopular && (
                            <p className="absolute px-3 text-[11px] font-bold tracking-wider uppercase -top-3.5 left-6 py-1 bg-pink-600 border border-pink-500 rounded-full text-white">
                                Most Popular
                            </p>
                        )}
                        <div className="space-y-4">
                            <div>
                                <p className="text-zinc-400 font-medium text-xs tracking-wider uppercase">{plan.name}</p>
                                <h1 className="text-3xl font-bold mt-1 text-white flex items-baseline">
                                    ${plan.price}
                                    <span className="text-zinc-500 font-normal text-xs ml-1">/{plan.period}</span>
                                </h1>
                            </div>
                            <hr className="border-pink-950" />
                            <ul className="list-none text-zinc-300 space-y-3 mt-4 text-xs">
                                {plan.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-start gap-2">
                                        <CheckIcon className="size-4 text-pink-500 shrink-0 mt-0.5" />
                                        <p className="leading-tight">{feature}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <button 
                            type="button" 
                            onClick={() => handlePlanClick(plan)}
                            className={`w-full py-2.5 rounded-xl font-bold text-xs mt-8 transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 ${
                                plan.mostPopular 
                                    ? 'bg-pink-600 text-white hover:bg-pink-500 shadow-lg shadow-pink-600/35' 
                                    : 'bg-white/10 hover:bg-white/20 text-zinc-200 border border-white/10'
                            }`}
                        >
                            <CreditCard className="size-3.5" /> Get Started
                        </button>
                    </motion.div>
                ))}
            </div>

            {/* PAYMENTS SANDBOX CHECKOUT MODAL */}
            <AnimatePresence>
                {selectedPlan && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="bg-[#121214] border border-white/10 rounded-2xl w-full max-w-[480px] p-6 shadow-2xl relative overflow-hidden"
                        >
                            {/* Close Button */}
                            <button 
                                onClick={() => !paying && setSelectedPlan(null)}
                                className="absolute top-4 right-4 text-zinc-400 hover:text-white transition cursor-pointer"
                                disabled={paying}
                            >
                                <X className="size-5" />
                            </button>

                            {paymentSuccess ? (
                                /* Success State Overlay */
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="py-12 flex flex-col items-center justify-center text-center space-y-4"
                                >
                                    <div className="size-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                        <CheckCircle2 className="size-10 text-emerald-500 animate-bounce" />
                                    </div>
                                    <h2 className="text-xl font-bold text-zinc-100">Payment Successful!</h2>
                                    <p className="text-xs text-zinc-400 max-w-xs">
                                        Your account has been upgraded to the **{selectedPlan.name}** plan. Redirecting to workspace...
                                    </p>
                                </motion.div>
                            ) : (
                                /* Form State */
                                <div className="space-y-5">
                                    <div>
                                        <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                                            <Lock className="size-4.5 text-pink-500" /> Secure Sandbox Checkout
                                        </h2>
                                        <p className="text-xs text-zinc-400">Order Summary: {selectedPlan.name} Plan — ${selectedPlan.price}/month</p>
                                    </div>

                                    {/* MOCK CREDIT CARD VISUALS */}
                                    <div className="w-full h-44 rounded-xl bg-linear-to-br from-pink-700 to-indigo-950 p-5 flex flex-col justify-between text-white shadow-xl relative border border-white/15 overflow-hidden">
                                        {/* Card design circles */}
                                        <div className="absolute right-0 bottom-0 size-32 bg-white/5 rounded-full blur-2xl" />
                                        <div className="flex justify-between items-start">
                                            <div className="size-10 rounded bg-white/10 border border-white/20 flex items-center justify-center font-bold italic tracking-wider text-xs">
                                                CHIP
                                            </div>
                                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-300">ClickCraftPay</span>
                                        </div>

                                        <div className="space-y-4">
                                            {/* Card number display */}
                                            <p className="text-sm font-mono tracking-widest text-zinc-100">
                                                {cardNumber || "•••• •••• •••• ••••"}
                                            </p>
                                            <div className="flex justify-between items-end text-xs">
                                                <div className="space-y-0.5">
                                                    <span className="text-[9px] uppercase tracking-wider text-zinc-400">Card Holder</span>
                                                    <p className="font-semibold uppercase tracking-wide truncate max-w-[200px]">
                                                        {cardName || user?.name || "CARDHOLDER NAME"}
                                                    </p>
                                                </div>
                                                <div className="space-y-0.5 text-right">
                                                    <span className="text-[9px] uppercase tracking-wider text-zinc-400">Expires</span>
                                                    <p className="font-semibold font-mono tracking-wide">{cardExpiry || "MM/YY"}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {paymentError && (
                                        <div className="bg-red-500/10 border border-red-500/20 text-red-300 text-xs px-4 py-2.5 rounded-xl flex items-start gap-2">
                                            <AlertCircle className="size-4 shrink-0 mt-0.5" />
                                            <span>{paymentError}</span>
                                        </div>
                                    )}

                                    <form onSubmit={handlePaymentSubmit} className="space-y-4">
                                        {/* Cardholder name */}
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-semibold tracking-wide uppercase text-zinc-400">Cardholder Name</label>
                                            <input
                                                type="text"
                                                value={cardName}
                                                onChange={(e) => setCardName(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-pink-500 transition"
                                                required
                                            />
                                        </div>

                                        {/* Card number */}
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-semibold tracking-wide uppercase text-zinc-400">Card Number</label>
                                            <input
                                                type="text"
                                                value={cardNumber}
                                                onChange={(e) => handleCardNumberChange(e.target.value)}
                                                placeholder="0000 0000 0000 0000"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-pink-500 transition font-mono tracking-wider"
                                                required
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            {/* Card expiry */}
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-semibold tracking-wide uppercase text-zinc-400">Expiry Date</label>
                                                <input
                                                    type="text"
                                                    value={cardExpiry}
                                                    onChange={(e) => handleExpiryChange(e.target.value)}
                                                    placeholder="MM/YY"
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-pink-500 transition font-mono tracking-wider"
                                                    required
                                                />
                                            </div>

                                            {/* Card CVC */}
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-semibold tracking-wide uppercase text-zinc-400">CVC / CVV</label>
                                                <input
                                                    type="password"
                                                    value={cardCvc}
                                                    onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, "").substring(0, 4))}
                                                    placeholder="•••"
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-pink-500 transition font-mono tracking-wider"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {/* Submit Button */}
                                        <button
                                            type="submit"
                                            disabled={paying}
                                            className="w-full py-3 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-xl text-xs transition disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-pink-600/35"
                                        >
                                            {paying ? (
                                                <>
                                                    <Loader2 className="size-3.5 animate-spin" />
                                                    <span>Processing Sandbox Payment...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Lock className="size-3.5" />
                                                    <span>Pay ${selectedPlan.price} & Upgrade</span>
                                                </>
                                            )}
                                        </button>

                                        <p className="text-[10px] text-zinc-500 text-center flex items-center justify-center gap-1">
                                            <Lock className="size-3" /> Encrypted Sandbox Connection — No real funds are billed.
                                        </p>
                                    </form>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
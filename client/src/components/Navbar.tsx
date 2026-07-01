import { MenuIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const renderCreditsBadge = () => {
        if (!user) return null;
        const isPremium = user.plan === "Pro" || user.plan === "Enterprise";
        if (isPremium) {
            return (
                <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-linear-to-r from-pink-500 to-rose-500 text-white rounded-full shadow-lg shadow-pink-500/20 uppercase tracking-wider border border-pink-400/25">
                    {user.plan}
                </span>
            );
        }
        return (
            <span className="px-2.5 py-0.5 text-[11px] font-medium bg-white/5 text-pink-300 border border-pink-500/20 rounded-full">
                Credits: {user.credits !== undefined ? user.credits : 5}
            </span>
        );
    };

    return (
        <>
            <motion.nav
                className="fixed top-0 z-50 flex items-center justify-between w-full py-4 px-6 md:px-16 lg:px-24 xl:px-32 backdrop-blur-md"
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{
                    type: "spring",
                    stiffness: 250,
                    damping: 30,
                }}
            >
                {/* Logo */}
                <Link
                    to="/"
                    className="text-2xl font-bold text-pink-500"
                >
                    Thumblify
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-8 transition duration-500">
                    <Link
                        to="/"
                        className="hover:text-pink-300 transition"
                    >
                        Home
                    </Link>

                    <Link
                        to="/generate"
                        className="hover:text-pink-300 transition"
                    >
                        Generate
                    </Link>

                    <Link
                        to="/my-generation"
                        className="hover:text-pink-300 transition"
                    >
                        My Generations
                    </Link>

                    <Link
                        to="/contact"
                        className="hover:text-pink-300 transition"
                    >
                        Contact
                    </Link>
                </div>

                {/* Desktop Button */}
                {user ? (
                    <div className="hidden md:flex items-center gap-4">
                        <span className="text-zinc-200">Hi, <span className="font-semibold text-pink-400">{user.name}</span></span>
                        {renderCreditsBadge()}
                        <button
                            onClick={logout}
                            className="px-5 py-2 bg-pink-950/40 text-pink-200 border border-pink-600/30 hover:border-pink-500 hover:bg-pink-600 hover:text-white active:scale-95 transition-all rounded-full"
                        >
                            Logout
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => navigate("/login")}
                        className="hidden md:block px-6 py-2.5 bg-pink-600 hover:bg-pink-700 active:scale-95 transition-all rounded-full"
                    >
                        Get Started
                    </button>
                )}

                {/* Mobile Menu Button */}
                <button
                    onClick={() => setIsOpen(true)}
                    className="md:hidden"
                >
                    <MenuIcon
                        size={26}
                        className="active:scale-90 transition"
                    />
                </button>
            </motion.nav>

            {/* Mobile Menu */}
            <div
                className={`fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex flex-col items-center justify-center text-lg gap-8 md:hidden transition-transform duration-300 ${
                    isOpen ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                <Link
                    onClick={() => setIsOpen(false)}
                    to="/"
                >
                    Home
                </Link>

                <Link
                    onClick={() => setIsOpen(false)}
                    to="/generate"
                >
                    Generate
                </Link>

                <Link
                    onClick={() => setIsOpen(false)}
                    to="/my-generation"
                >
                    My Generations
                </Link>

                <Link
                    onClick={() => setIsOpen(false)}
                    to="/contact"
                >
                    Contact
                </Link>

                {user ? (
                    <div className="flex flex-col items-center gap-3">
                        <span className="text-zinc-400">Hi, {user.name}</span>
                        {renderCreditsBadge()}
                        <button
                            onClick={() => {
                                logout();
                                setIsOpen(false);
                            }}
                            className="px-6 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-full transition"
                        >
                            Logout
                        </button>
                    </div>
                ) : (
                    <Link
                        onClick={() => setIsOpen(false)}
                        to="/login"
                    >
                        Login
                    </Link>
                )}

                <button
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center size-10 bg-pink-600 hover:bg-pink-700 transition text-white rounded-md"
                >
                    <XIcon size={22} />
                </button>
            </div>
        </>
    );
}
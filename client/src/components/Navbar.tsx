import { MenuIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    const { user, logout } = useAuth();

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
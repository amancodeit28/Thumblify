import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { IUser } from "../assets/assets";

interface AuthContextType {
    user: IUser | null;
    token: string | null;
    loading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<boolean>;
    register: (name: string, email: string, password: string) => Promise<boolean>;
    logout: () => void;
    clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<IUser | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem("thumblify_token"));
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    // Fetch user profile on load or token change
    useEffect(() => {
        const fetchUserProfile = async () => {
            if (!token) {
                setUser(null);
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/auth/user`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setUser(data);
                } else {
                    // Token expired or invalid
                    logout();
                }
            } catch (err) {
                console.error("Error fetching user profile:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchUserProfile();
    }, [token]);

    const login = async (email: string, password: string): Promise<boolean> => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Login failed");
            }

            localStorage.setItem("thumblify_token", data.token);
            setToken(data.token);
            setUser({ name: data.name, email: data.email });
            navigate("/generate");
            return true;
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
            return false;
        }
    };

    const register = async (name: string, email: string, password: string): Promise<boolean> => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Registration failed");
            }

            localStorage.setItem("thumblify_token", data.token);
            setToken(data.token);
            setUser({ name: data.name, email: data.email });
            navigate("/generate");
            return true;
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem("thumblify_token");
        setToken(null);
        setUser(null);
        navigate("/login");
    };

    const clearError = () => setError(null);

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                loading,
                error,
                login,
                register,
                logout,
                clearError,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

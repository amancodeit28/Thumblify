import React, { useState } from "react"
import SoftBackdrop from "./SoftBackdrop"
import { useAuth } from "../context/AuthContext"

const login = () => {
    const [state, setState] = useState("login")
    const { login, register, error, clearError, loading } = useAuth()

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (state === "login") {
            await login(formData.email, formData.password)
        } else {
            await register(formData.name, formData.email, formData.password)
        }
    }

    const handleToggleState = () => {
        clearError()
        setState(prev => prev === "login" ? "register" : "login")
    }

    return (
        <>
            <SoftBackdrop />
            <div className='min-h-screen flex items-center justify-center'>
                <form
                    onSubmit={handleSubmit}
                    className="w-full sm:w-87.5 text-center bg-white/6 border border-white/10 rounded-2xl px-8 pb-10 mt-16 shadow-2xl backdrop-blur-sm">
                    <h1 className="text-white text-3xl mt-10 font-medium">
                        {state === "login" ? "Login" : "Sign up"}
                    </h1>

                    <p className="text-gray-400 text-sm mt-2">Please sign in to continue</p>

                    {error && (
                        <div className="bg-red-500/20 text-red-200 border border-red-500/30 text-xs px-4 py-2.5 rounded-xl mt-4 text-center">
                            {error}
                        </div>
                    )}

                    {state !== "login" && (
                        <div className="flex items-center mt-6 w-full bg-white/5 ring-2 ring-white/10 focus-within:ring-pink-500/60 h-12 rounded-full overflow-hidden pl-6 gap-2 transition-all ">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-white/60" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <circle cx="12" cy="8" r="5" /> <path d="M20 21a8 8 0 0 0-16 0" /> </svg>
                            <input type="text" name="name" placeholder="Name" className="w-full bg-transparent text-white placeholder-white/60 border-none outline-none " value={formData.name} onChange={handleChange} required />
                        </div>
                    )}

                    <div className="flex items-center w-full mt-4 bg-white/5 ring-2 ring-white/10 focus-within:ring-pink-500/60 h-12 rounded-full overflow-hidden pl-6 gap-2 transition-all ">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-white/75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" /> <rect x="2" y="4" width="20" height="16" rx="2" /> </svg>
                        <input type="email" name="email" placeholder="Email id" className="w-full bg-transparent text-white placeholder-white/60 border-none outline-none " value={formData.email} onChange={handleChange} required />
                    </div>

                    <div className=" flex items-center mt-4 w-full bg-white/5 ring-2 ring-white/10 focus-within:ring-pink-500/60 h-12 rounded-full overflow-hidden pl-6 gap-2 transition-all ">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-white/75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <rect width="18" height="11" x="3" y="11" rx="2" ry="2" /> <path d="M7 11V7a5 5 0 0 1 10 0v4" /> </svg>
                        <input type="password" name="password" placeholder="Password" className="w-full bg-transparent text-white placeholder-white/60 border-none outline-none" value={formData.password} onChange={handleChange} required />
                    </div>

                    <div className="mt-4 text-left">
                        <button type="button" className="text-sm text-pink-400 hover:underline cursor-pointer">
                            Forget password?
                        </button>
                    </div>

                    <button type="submit" disabled={loading} className="mt-6 w-full h-11 rounded-full text-white bg-pink-600 hover:bg-pink-500 transition disabled:opacity-50 flex items-center justify-center font-medium" >
                        {loading ? "Processing..." : (state === "login" ? "Login" : "Sign up")}
                    </button>

                    <p onClick={handleToggleState} className="text-gray-400 text-sm mt-5 cursor-pointer" >
                        {state === "login" ? "Don't have an account?" : "Already have an account?"}
                        <span className="text-pink-400 hover:underline ml-1">click here</span>
                    </p>
                </form>
            </div>
        </>
    )
}

export default login

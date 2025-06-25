import React, { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader } from 'lucide-react';
import { BrainIcon } from "../icons/BrainIcon";
import { useAuth } from "../contexts/AuthContext";

export const Login = () => {
    const [formData, setFormData] = useState({ email: "", password: "" });
    const emailInputRef = useRef<HTMLInputElement>(null);
    const passwordInputRef = useRef<HTMLInputElement>(null);
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!emailInputRef.current || !passwordInputRef.current) return;
        
        try {
            setLoading(true);
            setError("");
            
            await login(
                emailInputRef.current.value,
                passwordInputRef.current.value
            );
            
            navigate("/dashboard");
        } catch (error: any) {
            setError(error.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen">
            <div className="flex-3 w-full bg-black-600 flex items-center justify-center">
                <div className="w-80 fill-slate-100">
                    <BrainIcon/>
                    <div className="text-5xl font-bold text-slate-100 mt-5 flex justify-center">Second Brain</div>
                </div>
            </div>
            <div className="flex-2 w-full font-mono font-bold flex flex-col bg-beige-200 text-black items-center justify-center">
                <h2 className="text-[4vw]">&lt;Login/&gt;</h2>
                <form onSubmit={handleSubmit} className="flex font-mono flex-col gap-3 mt-5">
                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        ref={emailInputRef}
                        className="p-4 w-[450px] border rounded text-2xl"
                        required
                        autoComplete="off"
                    />
                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        ref={passwordInputRef}
                        className="p-4 w-[450px] border rounded text-2xl"
                        required
                    />
                    {error && <p className="text-red-500">{error}</p>}
                    <button 
                        type="submit" 
                        className="bg-black-600 text-white text-2xl p-2 text-center rounded-[10px] cursor-pointer flex items-center justify-center gap-2"
                        disabled={loading}
                    >
                        Login {loading && <Loader size={15} className="animate-spin" />}
                    </button>
                    <p>Don't have an account? <Link to={'/register'} className="underline">Register</Link></p>
                </form>
            </div>
        </div>
    );
}; 
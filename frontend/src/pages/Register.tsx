import React, { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader } from 'lucide-react';
import { BrainIcon } from "../icons/BrainIcon";
import { useAuth } from "../contexts/AuthContext";

export const Register = () => {
    const nameInputRef = useRef<HTMLInputElement>(null);
    const emailInputRef = useRef<HTMLInputElement>(null);
    const passwordInputRef = useRef<HTMLInputElement>(null);
    const confirmPasswordInputRef = useRef<HTMLInputElement>(null);
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!emailInputRef.current || !passwordInputRef.current || !confirmPasswordInputRef.current) return;
        
        if (passwordInputRef.current.value !== confirmPasswordInputRef.current.value) {
            setError("Passwords do not match");
            return;
        }
        
        try {
            setLoading(true);
            setError("");
            
            await register(
                emailInputRef.current.value,
                passwordInputRef.current.value,
                nameInputRef.current?.value
            );
            
            navigate("/dashboard");
        } catch (error: any) {
            setError(error.message || "Registration failed");
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
                <h2 className="text-[4vw]">&lt;Register/&gt;</h2>
                <form onSubmit={handleSubmit} className="flex font-mono flex-col gap-3 mt-5">
                    <input
                        type="text"
                        name="name"
                        placeholder="Name (Optional)"
                        ref={nameInputRef}
                        className="p-4 w-[450px] border rounded text-2xl"
                        autoComplete="name"
                    />
                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        ref={emailInputRef}
                        className="p-4 w-[450px] border rounded text-2xl"
                        required
                        autoComplete="email"
                    />
                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        ref={passwordInputRef}
                        className="p-4 w-[450px] border rounded text-2xl"
                        required
                        autoComplete="new-password"
                    />
                    <input
                        type="password"
                        name="confirmPassword"
                        placeholder="Confirm Password"
                        ref={confirmPasswordInputRef}
                        className="p-4 w-[450px] border rounded text-2xl"
                        required
                        autoComplete="new-password"
                    />
                    {error && <p className="text-red-500">{error}</p>}
                    <button 
                        type="submit" 
                        className="bg-black-600 text-white text-2xl p-2 text-center rounded-[10px] cursor-pointer flex items-center justify-center gap-2"
                        disabled={loading}
                    >
                        Register {loading && <Loader size={15} className="animate-spin" />}
                    </button>
                    <p>Already have an account? <Link to={'/login'} className="underline">Login</Link></p>
                </form>
            </div>
        </div>
    );
}; 
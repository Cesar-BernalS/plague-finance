import React, { useState } from "react";
import { DollarSign, TrendingUp, Shield, Sparkles, Lock, User, Mail } from "lucide-react";

export default function Login({ onLogin }) {
    const [isRegistering, setIsRegistering] = useState(false);
    const [formData, setFormData] = useState({
        username: "",
        password: "",
        description: "",
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const API_BASE = "http://10.22.164.189:8000";

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);

        const username = (formData.username || "").trim();
        const password = (formData.password || "").trim();

        if (!username || !password) {
            setMessage({ type: "error", text: "Usuario y contraseña obligatorios." });
            return;
        }

        const endpoint = isRegistering ? "/register" : "/login";
        const url = `${API_BASE}${endpoint}`;

        setLoading(true);
        try {
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username,
                    password,
                    ...(isRegistering ? { description: formData.description } : {}),
                }),
            });

            const data = await res.json().catch(() => ({}));

            if (res.ok) {
                const usernameResp = data.username ?? username;
                const token = data.token ?? null;

                setMessage({ 
                    type: "success", 
                    text: isRegistering ? "¡Registro exitoso! 🎉" : "¡Bienvenido de vuelta! 🚀" 
                });

                if (token) localStorage.setItem("auth_token", token);

                setTimeout(() => {
                    onLogin(usernameResp, token);
                }, 800);
            } else {
                const errText = data.error || data.message || `Error ${res.status}`;
                setMessage({ type: "error", text: errText });
            }
        } catch (err) {
            console.error("Network/Fetch error:", err);
            setMessage({ type: "error", text: "No se pudo conectar con el servidor." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative flex items-center justify-center min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-red-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            {/* Floating Icons */}
            <div className="absolute top-10 left-20 text-green-400/20 animate-bounce" style={{ animationDuration: '3s' }}>
                <DollarSign className="w-12 h-12" />
            </div>
            <div className="absolute bottom-20 left-32 text-blue-400/20 animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>
                <TrendingUp className="w-10 h-10" />
            </div>
            <div className="absolute top-32 right-24 text-purple-400/20 animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }}>
                <Shield className="w-11 h-11" />
            </div>

            {/* Main Content */}
            <div className="relative z-10 w-full max-w-md px-6">
                {/* Logo and Title */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-blue-600 flex items-center justify-center shadow-lg shadow-red-500/50 animate-pulse">
                            <DollarSign className="w-10 h-10 text-white" />
                        </div>
                    </div>
                    
                    <h1 className="text-5xl font-extrabold mb-3 bg-gradient-to-r from-red-500 via-blue-500 to-red-500 bg-clip-text text-transparent animate-gradient">
                        FinanCity
                    </h1>
                    
                    <p className="text-lg text-slate-300 mb-2">
                        {isRegistering
                            ? "Crea tu cuenta y comienza tu viaje financiero"
                            : "Bienvenido de vuelta"}
                    </p>
                    
                    <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
                        <Sparkles className="w-4 h-4 text-yellow-400" />
                        <span>Powered by Capital One</span>
                    </div>
                </div>

                {/* Form Card */}
                <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-slate-700/50">
                    {/* Message Alert */}
                    {message && (
                        <div className={`mb-6 p-4 rounded-xl border ${
                            message.type === "error" 
                                ? "bg-red-500/10 border-red-500/50 text-red-300" 
                                : "bg-green-500/10 border-green-500/50 text-green-300"
                        } animate-fade-in`}>
                            <p className="text-sm font-medium">{message.text}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Username Input */}
                        <div className="relative">
                            <label className="block text-sm font-semibold text-slate-300 mb-2">
                                Usuario
                            </label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    name="username"
                                    placeholder="tu_usuario"
                                    value={formData.username}
                                    onChange={handleChange}
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div className="relative">
                            <label className="block text-sm font-semibold text-slate-300 mb-2">
                                Contraseña
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="password"
                                    name="password"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {/* Description (Only for Register) */}
                        {isRegistering && (
                            <div className="relative animate-fade-in">
                                <label className="block text-sm font-semibold text-slate-300 mb-2">
                                    Sobre ti (opcional)
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                                    <textarea
                                        name="description"
                                        placeholder="Cuéntanos un poco sobre ti..."
                                        value={formData.description}
                                        onChange={handleChange}
                                        className="w-full pl-12 pr-4 py-3.5 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none h-24"
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Procesando...</span>
                                </div>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    {isRegistering ? "Crear Cuenta" : "Iniciar Sesión"}
                                    <TrendingUp className="w-5 h-5" />
                                </span>
                            )}
                        </button>
                    </form>

                    {/* Toggle Register/Login */}
                    <div className="mt-6 text-center">
                        <p className="text-slate-400">
                            {isRegistering ? "¿Ya tienes cuenta?" : "¿No tienes cuenta?"}{" "}
                            <button
                                onClick={() => {
                                    setIsRegistering(!isRegistering);
                                    setMessage(null);
                                }}
                                className="text-blue-400 hover:text-blue-300 font-semibold transition-colors hover:underline"
                                disabled={loading}
                            >
                                {isRegistering ? "Inicia sesión aquí" : "Regístrate gratis"}
                            </button>
                        </p>
                    </div>
                </div>

                {/* Features */}
                <div className="mt-8 grid grid-cols-3 gap-4 text-center">
                    <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
                        <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-green-500/20 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-green-400" />
                        </div>
                        <p className="text-xs text-slate-300 font-medium">Aprende Jugando</p>
                    </div>
                    
                    <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
                        <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-blue-500/20 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-blue-400" />
                        </div>
                        <p className="text-xs text-slate-300 font-medium">100% Seguro</p>
                    </div>
                    
                    <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
                        <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-purple-500/20 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-purple-400" />
                        </div>
                        <p className="text-xs text-slate-300 font-medium">IA Integrada</p>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-slate-500 mt-6">
                    © 2025 FinanCity | Capital One Hackathon
                </p>
            </div>

            {/* CSS Animation for gradient */}
            <style>{`
                @keyframes gradient {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }
                .animate-gradient {
                    background-size: 200% 200%;
                    animation: gradient 3s ease infinite;
                }
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out;
                }
            `}</style>
        </div>
    );
}
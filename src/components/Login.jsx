import React, { useState } from "react";

export default function Login({ onLogin }) {
    const [isRegistering, setIsRegistering] = useState(false);
    const[formData, setFormData] = useState({
        username: "",
        password: "",
        description: "",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if(!formData.username || !formData.password){
            alert("Username and password are required.");
            return;
        }

        onLogin(formData.username);
    };

return (<div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 text-white font-poppins">
    <h1 className="text-4xl font-extrabold mb-4">💸 FinanCity</h1>
    <p className="mb-6 text-lg text-slate-300">
        {isRegistering
        ? "Crea tu cuenta y empieza a aprender finanzas jugando 🧠"
        : "Inicia sesión para continuar tu progreso 🚀"}
    </p>

    <form
        onSubmit={handleSubmit}
        className="flex flex-col w-80 gap-4 bg-slate-800 p-6 rounded-xl shadow-lg"
    >
        <input
        type="text"
        name="username"
        placeholder="Usuario"
        value={formData.username}
        onChange={handleChange}
        className="p-3 rounded-md text-black"
        required
        />

        <input
        type="password"
        name="password"
        placeholder="Contraseña"
        value={formData.password}
        onChange={handleChange}
        className="p-3 rounded-md text-black"
        required
        />

        {isRegistering && (
        <textarea
            name="description"
            placeholder="Cuéntanos algo sobre ti..."
            value={formData.description}
            onChange={handleChange}
            className="p-3 rounded-md text-black"
        />
        )}

        <button
        type="submit"
        className="bg-green-500 hover:bg-green-600 text-white py-2 rounded-md font-semibold transition-all duration-200"
        >
        {isRegistering ? "Registrarme" : "Entrar"}
        </button>
    </form>

    <p className="mt-4">
        {isRegistering ? "¿Ya tienes cuenta?" : "¿No tienes cuenta?"}{" "}
        <span
        onClick={() => setIsRegistering(!isRegistering)}
        className="text-cyan-400 cursor-pointer hover:underline font-semibold"
        >
        {isRegistering ? "Inicia sesión" : "Regístrate aquí"}
        </span>
    </p>
    </div>
)
}
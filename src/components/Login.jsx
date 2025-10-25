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

return ()
}
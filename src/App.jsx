import React, { useState } from "react";
import Login from "./components/Login";
import MapView from "./components/MapView";

export default function App() {
    const [user, setUser] = useState(null); 

    const handleLogin = (username) => {
        setUser(username);
        console.log("User logged in:", username);
    };

    return()
}


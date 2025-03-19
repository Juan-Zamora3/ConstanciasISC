import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import Form from "../components/Form"; 

export function Singup({ setIsAuthenticated }) { 
  const [usuario, setUsuario] = useState("");  
  const [password, setPassword] = useState("");  
  const navigate = useNavigate();

  const handleSingup = (e) => {
    e.preventDefault();

    // Simulación de autenticación
    if (usuario === "admin" && password === "1234") {
      localStorage.setItem("auth", "true"); // Guarda sesión
      setIsAuthenticated(true); // Cambia estado global de autenticación
      navigate("/"); // Redirige a la aplicación
    } else {
      alert("Credenciales incorrectas");
    }
  };

  return (
    <SingupContainer>
      <Form 
        usuario={usuario} 
        setUsuario={setUsuario} 
        password={password} 
        setPassword={setPassword} 
        handleLogin={handleSingup}  
      />
    </SingupContainer>
  );
}

const SingupContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: #121212;
`;

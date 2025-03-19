import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import Form from "../components/Form";
import { auth } from "../firebaseConfig"; // Solo importa `auth`
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth"; // Importa funciones de autenticación

export function Singup({ setIsAuthenticated }) {
  const [usuario, setUsuario] = useState("");  
  const [password, setPassword] = useState("");  
  const navigate = useNavigate();

  // Función para iniciar sesión con Firebase
  const handleSignup = async (e) => {
    e.preventDefault();

    // Validar que el correo sea institucional
    if (!usuario.endsWith("@puertopenasco.tecnm.mx")) {
      alert("Solo los maestros con correo institucional pueden iniciar sesión.");
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, usuario, password);
      console.log("Usuario autenticado:", userCredential.user);

      localStorage.setItem("auth", "true"); // Guardar sesión
      setIsAuthenticated(true);
      navigate("/"); // Redirigir a la aplicación
    } catch (error) {
      alert("Error al iniciar sesión: " + error.message);
    }
  };

  // Función para registrar un nuevo usuario en Firebase
  const handleRegister = async (e) => {
    e.preventDefault();

    // Validar correo institucional
    if (!usuario.endsWith("@puertopenasco.tecnm.mx")) {
      alert("Solo los maestros con correo institucional pueden registrarse.");
      return;
    }

    if (password.length < 6) {
      alert("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, usuario, password);
      console.log("Usuario registrado:", userCredential.user);
      
      alert("Registro exitoso. Ahora puedes iniciar sesión.");
      setUsuario(""); // Limpiar campos
      setPassword("");
    } catch (error) {
      alert("Error al registrarse: " + error.message);
    }
  };

  return (
    <SignupContainer>
      <Form 
        usuario={usuario} 
        setUsuario={setUsuario} 
        password={password} 
        setPassword={setPassword} 
        handleLogin={handleSignup}  
        handleRegister={handleRegister} // Pasamos la función de registro al Formulario
      />
    </SignupContainer>
  );
}

// Estilos
const SignupContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: #121212;
`;

import React from "react";
import styled from "styled-components";

const Form = ({ usuario, setUsuario, password, setPassword, handleLogin, handleRegister }) => {
  return (
    <StyledWrapper>
      <div className="form-container">
        <p className="title">Inicio de Sesión</p>
        <form className="form">
          <div className="input-group">
            <label htmlFor="email">Correo Institucional</label>
            <input 
              type="email" 
              id="email"
              placeholder="Ejemplo: juan.lc@puertopenasco.tecnm.mx" 
              value={usuario} 
              onChange={(e) => setUsuario(e.target.value)} 
              required 
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">Contraseña</label>
            <input 
              type="password" 
              id="password"
              placeholder="Contraseña" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>

          {/* Botones de Iniciar Sesión y Registro */}
          <button type="submit" className="login-button" onClick={handleLogin}>
            Iniciar Sesión
          </button>
          <button type="button" className="register-button" onClick={handleRegister}>
            Registrarse
          </button>
        </form>
      </div>
    </StyledWrapper>
  );
};

// Estilos del formulario
const StyledWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: #121212;

  .form-container {
    width: 350px;
    border-radius: 10px;
    background-color: #1e293b;
    padding: 2rem;
    color: #f3f4f6;
    box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2);
  }

  .title {
    text-align: center;
    font-size: 1.6rem;
    font-weight: 700;
    margin-bottom: 1rem;
  }

  .form {
    margin-top: 1rem;
  }

  .input-group {
    margin-top: 1rem;
  }

  .input-group label {
    display: block;
    color: #cbd5e1;
    margin-bottom: 5px;
    font-size: 0.9rem;
  }

  .input-group input {
    width: 100%;
    border-radius: 5px;
    border: 1px solid #475569;
    outline: none;
    background-color: #0f172a;
    padding: 10px;
    color: #f3f4f6;
    font-size: 1rem;
  }

  .input-group input:focus {
    border-color: #a78bfa;
    box-shadow: 0px 0px 5px rgba(167, 139, 250, 0.5);
  }

  .forgot {
    display: flex;
    justify-content: flex-end;
    margin-top: 5px;
  }

  .forgot a {
    color: #a78bfa;
    text-decoration: none;
    font-size: 0.85rem;
  }

  .forgot a:hover {
    text-decoration: underline;
  }

  .login-button {
    width: 100%;
    background-color: #4a90e2;
    padding: 10px;
    text-align: center;
    color: #ffffff;
    border: none;
    border-radius: 5px;
    font-weight: 600;
    font-size: 1rem;
    margin-top: 15px;
    cursor: pointer;
    transition: background 0.3s;
  }

  .login-button:hover {
    background-color: #357abd;
  }

  .register-button {
    width: 100%;
    background-color: #a78bfa;
    padding: 10px;
    text-align: center;
    color: #ffffff;
    border: none;
    border-radius: 5px;
    font-weight: 600;
    font-size: 1rem;
    margin-top: 10px;
    cursor: pointer;
    transition: background 0.3s;
  }

  .register-button:hover {
    background-color: #7c69e7;
  }
`;

export default Form;

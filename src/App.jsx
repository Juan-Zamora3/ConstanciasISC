import React, { useState, useEffect } from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import styled from "styled-components";
import { Sidebar } from "./components/Sidebar";
import { Light, Dark } from "./styles/Themes";
import { ThemeProvider } from "styled-components";
import { Singup}  from "./pages/singup"; // Importación corregida
import { MyRoutes } from "./routers/routes"; // Asegurar que existe este archivo

export const ThemeContext = React.createContext(null);

function App() {
  const [theme, setTheme] = useState("light");
  const themeStyle = theme === "light" ? Light : Dark;
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Estado para verificar autenticación (tomado de localStorage)
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem("auth") === "true"
  );
  
  const handleLogout = () => {
    localStorage.removeItem("auth"); // Elimina la sesión guardada
    setIsAuthenticated(false); // Cambia el estado de autenticación
  };

  return (
    <ThemeContext.Provider value={{ setTheme, theme }}>
      <ThemeProvider theme={themeStyle}>
        <BrowserRouter>
          <Routes>
            {/* Si no está autenticado, mostrar pantalla de login */}
            {!isAuthenticated ? (
              <>
                <Route path="/singup" element={<Singup setIsAuthenticated={setIsAuthenticated} />} />
                <Route path="*" element={<Navigate to="/singup" replace />} />
              </>
            ) : (
              <>
                <Route
                  path="/*"
                  element={
                    <Container className={sidebarOpen ? "sidebarState active" : "sidebarState"}>
                      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} handleLogout={handleLogout} />
                      <MyRoutes setIsAuthenticated={setIsAuthenticated} />
                    </Container>
                  }
                />
              </>
            )}
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}

// Estilos del contenedor
const Container = styled.div`
  display: grid;
  grid-template-columns: 90px auto;
  background: ${({ theme }) => theme.bgtotal};
  transition: all 0.3s;
  &.active {
    grid-template-columns: 250px auto;
  }
  color: ${({ theme }) => theme.text};
`;


export default App;

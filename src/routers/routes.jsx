import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Equipos } from "../pages/Equipos";
import { Integrantes } from "../pages/Integrantes";
import {Constancias} from "../pages/Constancias";
import {Configuracion} from "../pages/Configuracion";
import {Singup} from "../pages/singup"

export function MyRoutes({ setIsAuthenticated }) {
  return (
    <Routes>
      <Route path="/singup" element={<Singup setIsAuthenticated={setIsAuthenticated} />} />
      <Route path="/equipos" element={<Equipos />} />
      <Route path="/integrantes" element={<Integrantes />} />
      <Route path="/constancias" element={<Constancias />} />
      <Route path="/configuracion" element={<Configuracion />} />
    </Routes>
  );
}


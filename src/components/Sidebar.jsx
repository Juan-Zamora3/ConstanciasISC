import styled from "styled-components";
import logo from "../assets/react.svg";
import { v } from "../styles/Variables";
import {
  AiOutlineLeft,
  AiOutlineHome,
  AiOutlineApartment,
  AiOutlineSetting,
} from "react-icons/ai";
import { IoDocumentTextOutline } from "react-icons/io5";
import { MdEmojiEvents } from "react-icons/md";
import { FaUser } from "react-icons/fa";
import { MdGroups } from "react-icons/md";
import { MdOutlineAnalytics, MdLogout } from "react-icons/md";
import { NavLink, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { ThemeContext } from "../App";

export function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const navigate = useNavigate(); // Hook para redirección

  const handleLogout = () => {
    localStorage.removeItem("auth"); // Elimina la autenticación
    navigate("/singup"); // Redirige a la pantalla de login
    window.location.reload(); // Refresca la página para limpiar estado
  };

  const ModSidebaropen = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const { setTheme, theme } = useContext(ThemeContext);
  const CambiarTheme = () => {
    setTheme((theme) => (theme === "light" ? "dark" : "light"));
  };

  return (
    <Container isOpen={sidebarOpen} themeUse={theme}>
      <button className="Sidebarbutton" onClick={ModSidebaropen}>
        <AiOutlineLeft />
      </button>
      <div className="Logocontent">
        <h2>Constancias</h2>
      </div>
      {linksArray.map(({ icon, label, to }) => (
        <div className="LinkContainer" key={label}>
          <NavLink
            to={to}
            className={({ isActive }) => `Links${isActive ? ` active` : ``}`}
          >
            <div className="Linkicon">{icon}</div>
            {sidebarOpen && <span>{label}</span>}
          </NavLink>
        </div>
      ))}
      <Divider />
      {secondarylinksArray.map(({ icon, label, to }) => (
        <div className="LinkContainer" key={label}>
          <NavLink
            to={to}
            className={({ isActive }) => `Links${isActive ? ` active` : ``}`}
            onClick={label === "Salir" ? handleLogout : undefined} // Solo en "Salir"
          >
            <div className="Linkicon">{icon}</div>
            {sidebarOpen && <span>{label}</span>}
          </NavLink>
        </div>
      ))}
      <Divider />
      
      <div className="Themecontent">
        {sidebarOpen && <span className="titletheme">Dark mode</span>}
        <div className="ToggleSwitch">
          <label className="switch">
            <input
              type="checkbox"
              checked={theme === "dark"}
              onChange={CambiarTheme}
            />
            <span className="slider"></span>
          </label>
        </div>
      </div>
    </Container>
  );
}

//#region Data links
const linksArray = [
  {
    label: "Eventos",
    icon: <MdEmojiEvents />,
    to: "/eventos",
  },
  {
    label: "Constancias",
    icon: <IoDocumentTextOutline />,
    to: "/constancias",
  },
];
const secondarylinksArray = [
  {
    label: "Configuración",
    icon: <AiOutlineSetting />,
    to: "/configuracion",
  },
  {
    label: "Salir",
    icon: <MdLogout />,
    to: "/singup",
  },
];
//#endregion

//#region STYLED COMPONENTS
const Container = styled.div`
  color: ${(props) => props.theme.text};
  height: 100vh;
  background: ${(props) => props.theme.bg};
  position: sticky;
  padding-top: 20px;
  .Sidebarbutton {
    position: absolute;
    top: ${v.xxlSpacing};
    right: -18px;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: ${(props) => props.theme.bgtgderecha};
    box-shadow: 0 0 4px ${(props) => props.theme.bg3},
      0 0 7px ${(props) => props.theme.bg};
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s;
    transform: ${({ isOpen }) => (isOpen ? `initial` : `rotate(180deg)`)};
    border: none;
    letter-spacing: inherit;
    color: inherit;
    font-size: inherit;
    text-align: inherit;
    padding: 0;
    font-family: inherit;
    outline: none;
  }
  .Logocontent {
    display: flex;
    justify-content: center;
    align-items: center;

    padding-bottom: ${v.lgSpacing};
    .imgcontent {
      display: flex;
      img {
        max-width: 100%;
        height: auto;
      }
      cursor: pointer;
      transition: all 0.3s;
      transform: ${({ isOpen }) => (isOpen ? `scale(0.7)` : `scale(1.5)`)};
    }
    h2 {
      display: ${({ isOpen }) => (isOpen ? `block` : `none`)};
    }
  }
  .LinkContainer {
    margin: 8px 0;
   
    padding: 0 15%;
    :hover {
      background: ${(props) => props.theme.bg3};
    }
    .Links {
      display: flex;
      align-items: center;
      text-decoration: none;
      padding: calc(${v.smSpacing}-2px) 0;
      color: ${(props) => props.theme.text};
      height:50px;
      .Linkicon {
        padding: ${v.smSpacing} ${v.mdSpacing};
        display: flex;

        svg {
          font-size: 25px;
        }
      }
      &.active {
        .Linkicon {
          svg {
            color: ${(props) => props.theme.bg4};
          }
        }
      }
    }
  }
  .Themecontent {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 15%;
    .titletheme {
      display: block;
      padding: 10px;
      font-weight: 700;
      opacity: ${({ isOpen }) => (isOpen ? `1` : `0`)};
      transition: all 0.3s;
      white-space: nowrap;
      overflow: hidden;
    }
    .ToggleSwitch {
      margin: ${({ isOpen }) => (isOpen ? `auto 5px` : `auto 5px`)};
      
      /* Estilos para el toggle switch */
      .switch {
        position: relative;
        display: inline-block;
        width: 40px;
        height: 20px;
      }
      
      .switch input {
        opacity: 0;
        width: 0;
        height: 0;
      }
      
      .slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #ccc;
        transition: .4s;
        border-radius: 34px;
      }
      
      .slider:before {
        position: absolute;
        content: "";
        height: 16px;
        width: 16px;
        left: 2px;
        bottom: 2px;
        background-color: white;
        transition: .4s;
        border-radius: 50%;
      }
      
      input:checked + .slider {
        background-color: #2196F3;
      }
      
      input:checked + .slider:before {
        transform: translateX(20px);
      }
    }
  }
`;
const Divider = styled.div`
  height: 1px;
  width: 100%;
  background: ${(props) => props.theme.bg3};
  margin: ${v.lgSpacing} 0;
`;
//#endregion

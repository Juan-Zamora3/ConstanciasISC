import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; // Importar correctamente

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAaXYIqtfjms2cB1N0oTyuirrJYk6qsmaw", // Clave API válida
  authDomain: "constanciasisc.firebaseapp.com",
  projectId: "constanciasisc",
  storageBucket: "constanciasisc.appspot.com", // Reemplaza si el nombre es incorrecto
  messagingSenderId: "716702079630",
  appId: "1:716702079630:web:7eb7ab3fc11f67ef9c07df", // ID de aplicación correcto
  measurementId: "G-KH8FQF19M6"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app); // Obtener la instancia de autenticación

export { auth, app }; // Exportar correctamente

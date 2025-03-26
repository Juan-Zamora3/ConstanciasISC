import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; 
import { getFirestore } from "firebase/firestore"; // ✅ Importar Firestore

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAaXYIqtfjms2cB1N0oTyuirrJYk6qsmaw",
  authDomain: "constanciasisc.firebaseapp.com",
  projectId: "constanciasisc",
  storageBucket: "constanciasisc.appspot.com",
  messagingSenderId: "716702079630",
  appId: "1:716702079630:web:7eb7ab3fc11f67ef9c07df",
  measurementId: "G-KH8FQF19M6"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app); // ✅ Inicializar Firestore

export { firebaseConfig, app, auth, db }; // ✅ Exportar Firestore

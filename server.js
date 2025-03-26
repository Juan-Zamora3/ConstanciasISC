// server.js

import express from 'express';
import nodemailer from 'nodemailer';
import bodyParser from 'body-parser';
import cors from 'cors'; 
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Habilitar CORS para permitir solicitudes desde otros orígenes
app.use(cors());

// Configuración para parsear JSON (se aumenta el límite para archivos en Base64)
app.use(bodyParser.json({ limit: '10mb' }));

// -----------------------------------------------------------------------------
// CONFIGURACIÓN DEL TRANSPORTADOR DE NODEMAILER PARA MAILJET
// -----------------------------------------------------------------------------
const transporter = nodemailer.createTransport({
  host: 'in-v3.mailjet.com',
  port: 587,           // Usa 587 para STARTTLS
  secure: false,       // Para usar STARTTLS en vez de SSL puro
  auth: {
    user: '9cc11f30814a33827038897d882171ba', // API Key proporcionada por Mailjet
    pass: 'b21415937247f783386d1833b2b34e4e'  // Secret Key proporcionada por Mailjet
  }
});

// Función para registrar cada envío en un archivo de log (envios.log)
function registrarEnvio(correo, nombre, equipo, estado) {
  const logEntry = {
    correo,
    nombre,
    equipo,
    fecha: new Date().toISOString(),
    estado
  };
  const logFilePath = path.join(__dirname, 'envios.log');
  fs.appendFileSync(logFilePath, JSON.stringify(logEntry) + "\n", { encoding: 'utf8' });
}

// Endpoint para recibir la petición de envío de correo
app.post('/enviarConstancia', async (req, res) => {
  try {
    // Se espera recibir: correo, nombre, equipo y pdf (en Base64)
    const { correo, nombre, equipo, pdf } = req.body;
    
    if (!correo || !nombre || !equipo || !pdf) {
      return res.status(400).json({ error: 'Faltan campos requeridos: correo, nombre, equipo, pdf' });
    }
    
    // Convertir el string Base64 a un Buffer
    const pdfBuffer = Buffer.from(pdf, 'base64');
    
    // Configurar las opciones del correo
    const mailOptions = {
      from: 'ConstanciasISCITSPP@outlook.com', 
      // ↑ Asegúrate de haber verificado esta dirección en Mailjet o usa una dirección verificada
      to: correo,
      subject: 'Constancia de Participación',
      text: `Hola ${nombre},

Adjunto encontrarás tu constancia de participación para el equipo ${equipo}.

Saludos.`,
      attachments: [
        {
          filename: `Constancia_${equipo.replace(/\s/g, '_')}_${nombre.replace(/\s/g, '_')}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    // Enviar el correo utilizando nodemailer (Mailjet)
    await transporter.sendMail(mailOptions);
    
    // Registrar el envío en el log
    registrarEnvio(correo, nombre, equipo, 'enviado');
    
    return res.status(200).json({ message: 'Correo enviado y registro guardado' });
  } catch (error) {
    console.error('Error al enviar correo:', error);
    return res.status(500).json({ error: 'Error al enviar correo' });
  }
});

// Iniciar el servidor
app.listen(port, () => {  
  console.log(`Servidor corriendo en el puerto ${port}`);
});

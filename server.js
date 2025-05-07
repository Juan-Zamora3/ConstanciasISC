// server.js
import express from 'express';
import nodemailer from 'nodemailer';
import bodyParser from 'body-parser';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import dotenv from 'dotenv';
dotenv.config();  // carga .env


// ──────────────────────────────────────────────
// 1) Carga variables de entorno (.env)
// ──────────────────────────────────────────────
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// ──────────────────────────────────────────────
// 2) Middlewares
// ──────────────────────────────────────────────
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

// ──────────────────────────────────────────────
// 3) Configura el transporter SMTP (MailerSend)
// ──────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.MS_SMTP_HOST,
  port: Number(process.env.MS_SMTP_PORT),
  secure: false, // STARTTLS
  auth: {
    user: process.env.MS_SMTP_USER,
    pass: process.env.MS_SMTP_PASS
  }
});

// ──────────────────────────────────────────────
// 4) Función para loggear envíos
// ──────────────────────────────────────────────
function registrarEnvio(correo, nombre, equipo, estado) {
  const logEntry = {
    correo,
    nombre,
    equipo,
    fecha: new Date().toISOString(),
    estado
  };
  const logFile = path.join(__dirname, 'envios.log');
  fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n', 'utf8');
}

// ──────────────────────────────────────────────
// 5) Endpoint POST /enviarConstancia
// ──────────────────────────────────────────────
app.post('/enviarConstancia', async (req, res) => {
  try {
    const { correo, nombre, equipo, pdf } = req.body;
    if (!correo || !nombre || !equipo || !pdf) {
      return res.status(400).json({
        error: 'Faltan campos requeridos: correo, nombre, equipo o pdf'
      });
    }

    // Convierte Base64 a buffer
    const pdfBuffer = Buffer.from(pdf, 'base64');

    // Opciones del correo
    const mailOptions = {
      from: process.env.MAIL_FROM,
      to: correo,
      subject: 'Tu constancia de participación',
      text: `Hola ${nombre},

Adjunto encuentras tu constancia de participación para el equipo "${equipo}".

Saludos cordiales.`,
      attachments: [
        {
          filename: `Constancia_${equipo.replace(/\s+/g, '_')}_${nombre.replace(/\s+/g, '_')}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    // Envía el correo
    await transporter.sendMail(mailOptions);

    // Log
    registrarEnvio(correo, nombre, equipo, 'enviado');

    return res.status(200).json({ message: 'Correo enviado correctamente' });
  } catch (err) {
    console.error('Error al enviar correo:', err);
    registrarEnvio(req.body.correo, req.body.nombre, req.body.equipo, 'error');
    return res.status(500).json({ error: 'Error al enviar correo' });
  }
});

// ──────────────────────────────────────────────
// 6) Arranca el servidor
// ──────────────────────────────────────────────
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});

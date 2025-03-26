import nodemailer from 'nodemailer';

(async () => {
  try {
    // Crea el transportador con los datos SMTP de Mailjet
    const transporter = nodemailer.createTransport({
      host: 'in-v3.mailjet.com',
      port: 587,           // Usa 587 para STARTTLS
      secure: false,       // Para usar STARTTLS en vez de SSL puro
      auth: {
        user: '9cc11f30814a33827038897d882171ba',     // API Key proporcionada por Mailjet
        pass: 'b21415937247f783386d1833b2b34e4e'   // Secret Key proporcionada por Mailjet
      }
    });

    // Verifica la conexión SMTP
    await transporter.verify();
    console.log('Conexión SMTP verificada exitosamente con Mailjet.');

    // Envía un correo de prueba
    const info = await transporter.sendMail({
      from: 'ConstanciasISCITSPP@outlook.com', // Debe coincidir con el remitente que hayas verificado
      to: 'juan-zamora311@outlook.es', // Cambia este correo por uno real
      subject: 'Correo de prueba desde Mailjet',
      text: 'Este es un correo de prueba enviado desde nodemailer usando Mailjet.'
    });

    console.log('Correo enviado correctamente, ID:', info.messageId);
  } catch (error) {
    console.error('Error en la conexión o envío de correo:', error);
  }
})();

require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Almacén en memoria de códigos temporales de restablecimiento
// Clave: email en minúsculas -> { code, expiresAt, username }
const verificationCodes = new Map();

// Configuración del transporter SMTP con Gmail
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: false, // TLS con STARTTLS en puerto 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

// Endpoint de prueba de salud
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    empresa: 'HURIOS RALLY E.I.R.L.',
    timestamp: new Date().toISOString(),
  });
});

/**
 * 1. Enviar código de verificación de 6 dígitos
 * Body: { email, username }
 */
app.post('/api/auth/send-reset-code', async (req, res) => {
  const { email, username } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'El correo electrónico es requerido.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  // Generar código aleatorio de 6 dígitos numéricos
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expireMinutes = parseInt(process.env.RESET_CODE_EXPIRE_MINUTES || '10', 10);
  const expiresAt = Date.now() + expireMinutes * 60 * 1000;

  verificationCodes.set(cleanEmail, {
    code,
    expiresAt,
    username: username || 'Asesor Hurios Rally',
  });

  const destino = process.env.DEVELOPMENT_EMAIL_OVERRIDE || cleanEmail;

  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Código de Verificación - Hurios Rally</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0F172A; margin: 0; padding: 30px 15px; -webkit-font-smoothing: antialiased;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0">
      <tr>
        <td align="center">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: #FFFFFF; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.4);">
            <!-- HEADER CON FRANJA ROJA RALLY -->
            <tr>
              <td style="background-color: #0F172A; padding: 32px 25px 25px 25px; text-align: center; border-bottom: 4px solid #EF4444;">
                <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 12px auto;">
                  <tr>
                    <td style="background-color: #EF4444; width: 12px; height: 8px;"></td>
                    <td style="background-color: #FFFFFF; width: 12px; height: 8px;"></td>
                    <td style="background-color: #EF4444; width: 12px; height: 8px;"></td>
                    <td style="background-color: #FFFFFF; width: 12px; height: 8px;"></td>
                  </tr>
                  <tr>
                    <td style="background-color: #FFFFFF; width: 12px; height: 8px;"></td>
                    <td style="background-color: #EF4444; width: 12px; height: 8px;"></td>
                    <td style="background-color: #FFFFFF; width: 12px; height: 8px;"></td>
                    <td style="background-color: #EF4444; width: 12px; height: 8px;"></td>
                  </tr>
                </table>
                <h1 style="color: #FFFFFF; font-size: 26px; font-weight: 900; letter-spacing: 3px; margin: 0; text-transform: uppercase;">
                  HURIOS <span style="color: #EF4444; font-style: italic;">RALLY</span>
                </h1>
                <p style="color: #94A3B8; font-size: 11px; font-weight: 700; letter-spacing: 2px; margin: 6px 0 0 0; text-transform: uppercase;">
                  Repuestos Automotrices • E.I.R.L.
                </p>
              </td>
            </tr>

            <!-- CONTENIDO PRINCIPAL -->
            <tr>
              <td style="padding: 35px 30px 25px 30px; text-align: center;">
                <div style="display: inline-block; background-color: #EFF6FF; border-radius: 30px; padding: 6px 16px; margin-bottom: 18px;">
                  <span style="color: #0066FF; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">
                    🛡 Verificación de Seguridad
                  </span>
                </div>

                <h2 style="color: #0F172A; font-size: 20px; font-weight: 800; margin: 0 0 12px 0;">
                  Recuperación de Contraseña
                </h2>

                <p style="color: #64748B; font-size: 14px; line-height: 22px; margin: 0 0 24px 0;">
                  Hola <strong>${username || 'Usuario'}</strong>, recibimos tu solicitud para cambiar la contraseña de tu cuenta móvil asociada a:
                </p>

                <!-- CAJA DE CORREO DESTINATARIO -->
                <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 12px 16px; margin-bottom: 24px; display: inline-block; width: 85%;">
                  <span style="color: #64748B; font-size: 12px; font-weight: 600;">Cuenta a restaurar:</span><br>
                  <span style="color: #0066FF; font-size: 15px; font-weight: 800;">${cleanEmail}</span>
                </div>

                <p style="color: #475569; font-size: 13px; font-weight: 600; margin: 0 0 10px 0;">
                  Ingresa el siguiente código de 6 dígitos en la aplicación:
                </p>

                <!-- TARJETA DEL CÓDIGO -->
                <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 20px auto;">
                  <tr>
                    <td style="background-color: #F8FAFC; border: 2px dashed #0066FF; border-radius: 16px; padding: 16px 36px; text-align: center;">
                      <span style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #0066FF; display: block; margin-left: 10px;">
                        ${code}
                      </span>
                    </td>
                  </tr>
                </table>

                <!-- TIEMPO DE EXPIRACIÓN -->
                <p style="color: #EF4444; font-size: 12px; font-weight: 700; margin: 0 0 24px 0;">
                  ⏱ Este código vencerá en ${expireMinutes} minutos.
                </p>

                <div style="border-top: 1px solid #F1F5F9; padding-top: 20px;">
                  <p style="color: #94A3B8; font-size: 12px; line-height: 18px; margin: 0;">
                    Si no fuiste tú quien solicitó este cambio, no te preocupes. Nadie podrá cambiar tu clave sin este código de confirmación.
                  </p>
                </div>
              </td>
            </tr>

            <!-- FOOTER CORPORATIVO -->
            <tr>
              <td style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 22px 25px; text-align: center;">
                <p style="color: #475569; font-size: 12px; font-weight: 800; margin: 0 0 4px 0;">
                  HURIOS RALLY E.I.R.L.
                </p>
                <p style="color: #94A3B8; font-size: 11px; margin: 0 0 4px 0;">
                  RUC: 20608542191 • Av. Perú 2450, San Martín de Porres, Lima Norte
                </p>
                <p style="color: #CBD5E1; font-size: 10px; margin: 0;">
                  Sistema Móvil de Gestión de Inventario y Ventas
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'Hurios Rally E.I.R.L.'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to: destino,
      subject: `[Hurios Rally] Código de Verificación para ${cleanEmail}: ${code}`,
      html: htmlContent,
    });

    console.log(`[SMTP] Código ${code} enviado exitosamente a: ${destino} (MessageId: ${info.messageId})`);

    return res.json({
      success: true,
      message: `Código enviado exitosamente a ${cleanEmail}`,
      code: code, // Retornado también en el payload para pruebas o respaldo offline
      expiresInMinutes: expireMinutes,
    });
  } catch (error) {
    console.error('[SMTP Error]', error);
    return res.status(500).json({
      success: false,
      message: 'No se pudo enviar el correo de verificación. Revisa la conexión SMTP.',
      error: error.message,
      // Modo de contingencia para que el usuario no se quede bloqueado
      fallbackCode: code,
    });
  }
});

/**
 * 2. Verificar código de 6 dígitos
 * Body: { email, code }
 */
app.post('/api/auth/verify-reset-code', (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ success: false, message: 'Correo y código son requeridos.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const record = verificationCodes.get(cleanEmail);

  if (!record) {
    return res.status(400).json({
      success: false,
      message: 'No hay ninguna solicitud de recuperación activa para este correo.',
    });
  }

  if (Date.now() > record.expiresAt) {
    verificationCodes.delete(cleanEmail);
    return res.status(400).json({
      success: false,
      message: 'El código ha expirado. Por favor solicita uno nuevo.',
    });
  }

  if (record.code !== code.trim()) {
    return res.status(400).json({
      success: false,
      message: 'El código ingresado es incorrecto.',
    });
  }

  return res.json({
    success: true,
    message: 'Código verificado con éxito.',
    verified: true,
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Hurios Rally Backend] Servidor SMTP activo en http://localhost:${PORT}`);
});

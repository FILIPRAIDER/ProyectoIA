# Script para recrear mailer.js correctamente
$content = @'
// src/lib/mailer.js
import { Resend } from "resend";

const { RESEND_API_KEY, RESEND_FROM, RESEND_DEV_FORCE_TO } = process.env;

if (!RESEND_API_KEY) console.warn("[mailer] Falta RESEND_API_KEY en .env");
if (!RESEND_FROM) console.warn("[mailer] Falta RESEND_FROM en .env (ej: 'Bridge <noreply@tudominio.com>')");

const resend = new Resend(RESEND_API_KEY);

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (m) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[m]));
}

// Template HTML optimizado para Gmail - usa tablas en lugar de divs
const EMAIL_TEMPLATE = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitación a equipo - Bridge</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc;">
    <tr>
      <td style="padding: 40px 20px;">
        <table align="center" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: #ffffff;">
          
          <tr>
            <td style="background-color: #0b0f19; padding: 40px 32px; text-align: center;">
              <div style="font-size: 32px; font-weight: 700; color: #ffffff; margin-bottom: 8px;">Bridge</div>
              <div style="font-size: 14px; color: rgba(255, 255, 255, 0.8);">Conectando talento con oportunidades</div>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 48px 32px;">
              
              <h1 style="font-size: 24px; font-weight: 600; color: #0f172a; margin: 0 0 24px 0;">¡Hola!</h1>
              
              <p style="font-size: 16px; color: #475569; margin: 0 0 32px 0; line-height: 1.6;">Tienes una nueva invitación para unirte a un equipo en Bridge.</p>
              
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; margin: 32px 0;">
                <tr>
                  <td style="padding: 32px; text-align: center;">
                    
                    <div style="font-size: 32px; margin-bottom: 20px;">👥</div>
                    
                    <h2 style="font-size: 28px; font-weight: 700; color: #0b0f19; margin: 0 0 12px 0;">{{TEAM_NAME}}</h2>
                    
                    <p style="font-size: 16px; color: #475569; margin: 0 0 8px 0;"><strong style="color: #0f172a;">{{INVITER_NAME}}</strong> te ha invitado a formar parte de este equipo</p>
                    
                    <p style="font-size: 14px; color: #64748b; margin: 16px 0 32px 0;">Correo de invitación: <strong>{{INVITED_EMAIL}}</strong></p>
                    
                    <table align="center" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="background-color: #0b0f19;">
                          <a href="{{ACCEPT_URL}}" style="display: inline-block; padding: 16px 48px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none;">Aceptar invitación</a>
                        </td>
                      </tr>
                    </table>
                    
                  </td>
                </tr>
              </table>
              
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">
              
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border-left: 4px solid #0b0f19; margin: 32px 0;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <h3 style="font-size: 14px; font-weight: 600; color: #0f172a; margin: 0 0 8px 0; text-transform: uppercase;">¿Qué significa esto?</h3>
                    <p style="font-size: 14px; color: #64748b; margin: 0 0 12px 0; line-height: 1.6;">Al aceptar esta invitación, podrás:</p>
                    <p style="font-size: 14px; color: #475569; margin: 4px 0;"><span style="color: #0b0f19; font-weight: bold; margin-right: 8px;">✓</span> Colaborar con otros miembros del equipo</p>
                    <p style="font-size: 14px; color: #475569; margin: 4px 0;"><span style="color: #0b0f19; font-weight: bold; margin-right: 8px;">✓</span> Acceder a proyectos y recursos compartidos</p>
                    <p style="font-size: 14px; color: #475569; margin: 4px 0;"><span style="color: #0b0f19; font-weight: bold; margin-right: 8px;">✓</span> Participar en la gestión del equipo</p>
                    <p style="font-size: 14px; color: #475569; margin: 4px 0;"><span style="color: #0b0f19; font-weight: bold; margin-right: 8px;">✓</span> Compartir tu perfil profesional con el equipo</p>
                  </td>
                </tr>
              </table>
              
              <p style="font-size: 14px; color: #64748b; margin: 32px 0 0 0; line-height: 1.6;">Si no esperabas esta invitación o crees que fue enviada por error, puedes ignorar este correo de forma segura.</p>
              
            </td>
          </tr>
          
          <tr>
            <td style="background-color: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="font-size: 13px; color: #64748b; margin: 0 0 8px 0;">Este correo fue enviado desde <strong>Bridge</strong></p>
              <p style="font-size: 13px; color: #64748b; margin: 0;">© 2025 Bridge. Todos los derechos reservados.</p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

function buildBodies({ teamName, inviterName, invitedEmail, acceptUrl, message }) {
  const subject = `Invitación al equipo ${teamName} - Bridge`;
  
  const text = [
    `Bridge - Invitación a equipo`,
    ``,
    `¡Hola!`,
    ``,
    `${inviterName} te ha invitado a unirte al equipo "${teamName}" en Bridge.`,
    ``,
    `Correo de invitación: ${invitedEmail}`,
    ``,
    `Para aceptar la invitación, haz clic en el siguiente enlace:`,
    acceptUrl,
    ``,
    message ? `Mensaje del invitador: ${message}\n` : "",
    `¿Qué significa esto?`,
    `Al aceptar esta invitación, podrás:`,
    `- Colaborar con otros miembros del equipo`,
    `- Acceder a proyectos y recursos compartidos`,
    `- Participar en la gestión del equipo`,
    `- Compartir tu perfil profesional con el equipo`,
    ``,
    `Si no esperabas esta invitación o crees que fue enviada por error,`,
    `puedes ignorar este correo de forma segura.`,
    ``,
    `© 2025 Bridge. Todos los derechos reservados.`,
  ].join("\n");

  const html = EMAIL_TEMPLATE
    .replace(/{{TEAM_NAME}}/g, escapeHtml(teamName))
    .replace(/{{INVITER_NAME}}/g, escapeHtml(inviterName))
    .replace(/{{INVITED_EMAIL}}/g, escapeHtml(invitedEmail))
    .replace(/{{ACCEPT_URL}}/g, acceptUrl);

  return { subject, text, html };
}

export async function sendTeamInviteEmail({ to, teamName, inviterName, acceptUrl, message }) {
  const { subject, text, html } = buildBodies({ 
    teamName, 
    inviterName, 
    invitedEmail: to,
    acceptUrl, 
    message 
  });

  let toList = Array.isArray(to) ? to : [to];
  if (RESEND_DEV_FORCE_TO) {
    console.log(`[mailer] 🔄 Redirigiendo email de ${to} a ${RESEND_DEV_FORCE_TO} (dev mode)`);
    toList = [RESEND_DEV_FORCE_TO];
  }

  const { data, error } = await resend.emails.send({
    from: RESEND_FROM,
    to: toList,
    subject,
    text,
    html,
  });

  if (error) {
    console.error("[mailer] ❌ Resend error:", error);
    throw new Error(error.message || "Resend error");
  }

  console.log(`[mailer] ✅ Email enviado exitosamente. ID: ${data?.id}`);
  return { id: data?.id, provider: "resend" };
}
'@

# Escribir el archivo con UTF8 sin BOM
[System.IO.File]::WriteAllText("$PWD\src\lib\mailer.js", $content, (New-Object System.Text.UTF8Encoding $false))
Write-Host "✅ Archivo mailer.js recreado correctamente"

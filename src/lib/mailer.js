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

// Template HTML profesional para emails de invitación
const EMAIL_TEMPLATE = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitación a equipo - Bridge</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #0f172a;
      background-color: #f8fafc;
    }
    
    .email-wrapper {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    
    .email-header {
      background: linear-gradient(135deg, #0b0f19 0%, #1a1f2e 100%);
      padding: 40px 32px;
      text-align: center;
    }
    
    .logo-container {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }
    
    .logo-icon {
      width: 48px;
      height: 48px;
      background-color: #0b0f19;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid rgba(255, 255, 255, 0.2);
    }
    
    .logo-inner {
      width: 24px;
      height: 24px;
      background-color: #ffffff;
      border-radius: 4px;
    }
    
    .logo-text {
      font-size: 32px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: -0.5px;
    }
    
    .header-subtitle {
      color: rgba(255, 255, 255, 0.8);
      font-size: 14px;
      margin-top: 8px;
    }
    
    .email-body {
      padding: 48px 32px;
    }
    
    .greeting {
      font-size: 24px;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 24px;
    }
    
    .invitation-card {
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 32px;
      margin: 32px 0;
      text-align: center;
    }
    
    .invitation-icon {
      width: 64px;
      height: 64px;
      background: linear-gradient(135deg, #0b0f19 0%, #1a1f2e 100%);
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
      box-shadow: 0 4px 12px rgba(11, 15, 25, 0.15);
    }
    
    .invitation-icon::after {
      content: "👥";
      font-size: 32px;
    }
    
    .team-name {
      font-size: 28px;
      font-weight: 700;
      color: #0b0f19;
      margin-bottom: 12px;
      letter-spacing: -0.5px;
    }
    
    .invitation-text {
      font-size: 16px;
      color: #475569;
      margin-bottom: 8px;
    }
    
    .inviter-name {
      font-weight: 600;
      color: #0f172a;
    }
    
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #0b0f19 0%, #1a1f2e 100%);
      color: #ffffff;
      font-size: 16px;
      font-weight: 600;
      text-decoration: none;
      padding: 16px 48px;
      border-radius: 12px;
      margin-top: 32px;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      box-shadow: 0 4px 12px rgba(11, 15, 25, 0.2);
    }
    
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(11, 15, 25, 0.3);
    }
    
    .info-section {
      background-color: #f8fafc;
      border-left: 4px solid #0b0f19;
      padding: 20px 24px;
      margin: 32px 0;
      border-radius: 8px;
    }
    
    .info-title {
      font-size: 14px;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .info-text {
      font-size: 14px;
      color: #64748b;
      line-height: 1.6;
    }
    
    .info-list {
      list-style: none;
      padding-left: 0;
      margin-top: 12px;
    }
    
    .info-list li {
      padding-left: 24px;
      position: relative;
      margin-bottom: 8px;
      color: #475569;
      font-size: 14px;
    }
    
    .info-list li::before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #0b0f19;
      font-weight: bold;
    }
    
    .email-footer {
      background-color: #f8fafc;
      padding: 32px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    
    .footer-text {
      font-size: 13px;
      color: #64748b;
      margin-bottom: 8px;
    }
    
    .footer-link {
      color: #0b0f19;
      text-decoration: none;
      font-weight: 500;
    }
    
    .footer-link:hover {
      text-decoration: underline;
    }
    
    .divider {
      height: 1px;
      background: linear-gradient(to right, transparent, #e2e8f0, transparent);
      margin: 32px 0;
    }
    
    @media only screen and (max-width: 600px) {
      .email-body {
        padding: 32px 20px;
      }
      
      .invitation-card {
        padding: 24px 20px;
      }
      
      .greeting {
        font-size: 20px;
      }
      
      .team-name {
        font-size: 24px;
      }
      
      .cta-button {
        padding: 14px 32px;
        font-size: 15px;
      }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <!-- Header -->
    <div class="email-header">
      <div class="logo-container">
        <div class="logo-icon">
          <div class="logo-inner"></div>
        </div>
        <div class="logo-text">Bridge</div>
      </div>
      <div class="header-subtitle">Conectando talento con oportunidades</div>
    </div>
    
    <!-- Body -->
    <div class="email-body">
      <div class="greeting">¡Hola!</div>
      
      <p style="font-size: 16px; color: #475569; margin-bottom: 24px;">
        Tienes una nueva invitación para unirte a un equipo en Bridge.
      </p>
      
      <!-- Invitation Card -->
      <div class="invitation-card">
        <div class="invitation-icon"></div>
        <div class="team-name">{{TEAM_NAME}}</div>
        <p class="invitation-text">
          <span class="inviter-name">{{INVITER_NAME}}</span> te ha invitado a formar parte de este equipo
        </p>
        <p style="font-size: 14px; color: #64748b; margin-top: 16px;">
          Correo de invitación: <strong>{{INVITED_EMAIL}}</strong>
        </p>
        
        <a href="{{ACCEPT_URL}}" class="cta-button">
          Aceptar invitación
        </a>
      </div>
      
      <div class="divider"></div>
      
      <!-- Info Section -->
      <div class="info-section">
        <div class="info-title">¿Qué significa esto?</div>
        <p class="info-text">
          Al aceptar esta invitación, podrás:
        </p>
        <ul class="info-list">
          <li>Colaborar con otros miembros del equipo</li>
          <li>Acceder a proyectos y recursos compartidos</li>
          <li>Participar en la gestión del equipo</li>
          <li>Compartir tu perfil profesional con el equipo</li>
        </ul>
      </div>
      
      <p style="font-size: 14px; color: #64748b; margin-top: 32px;">
        Si no esperabas esta invitación o crees que fue enviada por error, 
        puedes ignorar este correo de forma segura.
      </p>
    </div>
    
    <!-- Footer -->
    <div class="email-footer">
      <p class="footer-text">
        Este correo fue enviado desde <strong>Bridge</strong>
      </p>
      <p class="footer-text">
        © 2025 Bridge. Todos los derechos reservados.
      </p>
    </div>
  </div>
</body>
</html>`;

function buildBodies({ teamName, inviterName, invitedEmail, acceptUrl, message }) {
  const subject = `Invitación al equipo ${teamName} - Bridge`;
  
  // Versión texto plano (fallback)
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

  // Reemplazar variables en el template HTML
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

  // Fuerza destinatario en dev si está configurado (para evitar el 403 sandbox)
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

// src/lib/mailer.js// src/lib/mailer.js

import { Resend } from "resend";import { Resend } from "resend";



const { RESEND_API_KEY, RESEND_FROM, RESEND_DEV_FORCE_TO } = process.env;const { RESEND_API_KEY, RESEND_FROM, RESEND_DEV_FORCE_TO } = process.env;



if (!RESEND_API_KEY) console.warn("[mailer] Falta RESEND_API_KEY en .env");if (!RESEND_API_KEY) console.warn("[mailer] Falta RESEND_API_KEY en .env");

if (!RESEND_FROM) console.warn("[mailer] Falta RESEND_FROM en .env (ej: 'Bridge <noreply@tudominio.com>')");if (!RESEND_FROM) console.warn("[mailer] Falta RESEND_FROM en .env (ej: 'Bridge <noreply@tudominio.com>')");



const resend = new Resend(RESEND_API_KEY);const resend = new Resend(RESEND_API_KEY);



function escapeHtml(s) {function escapeHtml(s) {

  return String(s).replace(/[&<>"']/g, (m) => ({  return String(s).replace(/[&<>"']/g, (m) => ({

    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",

  }[m]));  }[m]));

}}



// Template HTML optimizado para Gmail - usa tablas y estilos inline// Template HTML profesional para emails de invitación

const EMAIL_TEMPLATE = `<!DOCTYPE html>// ✅ Optimizado para Gmail - usa tablas y estilos inline

<html lang="es">const EMAIL_TEMPLATE = `<!DOCTYPE html>

<head><html lang="es">

  <meta charset="UTF-8"><head>

  <meta name="viewport" content="width=device-width, initial-scale=1.0">  <meta charset="UTF-8">

  <title>Invitación a equipo - Bridge</title>  <meta name="viewport" content="width=device-width, initial-scale=1.0">

</head>  <title>Invitación a equipo - Bridge</title>

<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f8fafc;"></head>

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc;"><body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #0f172a; background-color: #f8fafc;">

    <tr>  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; padding: 20px 0;">

      <td style="padding: 40px 20px;">    <tr>

        <!-- Contenedor principal (max-width: 600px) -->      <td align="center">

        <table align="center" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">        <!-- Contenedor principal -->

                  <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; margin: 0 auto;

          <!-- Header con fondo oscuro -->      margin: 0 auto;

          <tr>      background-color: #ffffff;

            <td style="background-color: #0b0f19; padding: 40px 32px; text-align: center;">    }

              <!-- Logo y título -->    

              <table align="center" cellpadding="0" cellspacing="0" border="0">    .email-header {

                <tr>      background: linear-gradient(135deg, #0b0f19 0%, #1a1f2e 100%);

                  <td style="text-align: center;">      padding: 40px 32px;

                    <div style="display: inline-block; width: 48px; height: 48px; background-color: #ffffff; border-radius: 12px; margin-bottom: 16px;"></div>      text-align: center;

                  </td>    }

                </tr>    

                <tr>    .logo-container {

                  <td style="font-size: 32px; font-weight: 700; color: #ffffff; text-align: center; padding-bottom: 8px;">      display: inline-flex;

                    Bridge      align-items: center;

                  </td>      gap: 12px;

                </tr>      margin-bottom: 16px;

                <tr>    }

                  <td style="font-size: 14px; color: rgba(255, 255, 255, 0.8); text-align: center;">    

                    Conectando talento con oportunidades    .logo-icon {

                  </td>      width: 48px;

                </tr>      height: 48px;

              </table>      background-color: #0b0f19;

            </td>      border-radius: 12px;

          </tr>      display: flex;

                align-items: center;

          <!-- Cuerpo del email -->      justify-content: center;

          <tr>      border: 2px solid rgba(255, 255, 255, 0.2);

            <td style="padding: 48px 32px;">    }

                  

              <!-- Saludo -->    .logo-inner {

              <h1 style="font-size: 24px; font-weight: 600; color: #0f172a; margin: 0 0 24px 0;">      width: 24px;

                ¡Hola!      height: 24px;

              </h1>      background-color: #ffffff;

                    border-radius: 4px;

              <p style="font-size: 16px; color: #475569; margin: 0 0 32px 0; line-height: 1.6;">    }

                Tienes una nueva invitación para unirte a un equipo en Bridge.    

              </p>    .logo-text {

                    font-size: 32px;

              <!-- Tarjeta de invitación -->      font-weight: 700;

              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; margin: 32px 0;">      color: #ffffff;

                <tr>      letter-spacing: -0.5px;

                  <td style="padding: 32px; text-align: center;">    }

                        

                    <!-- Icono -->    .header-subtitle {

                    <div style="width: 64px; height: 64px; background-color: #0b0f19; border-radius: 50%; margin: 0 auto 20px; display: inline-block; line-height: 64px; font-size: 32px;">      color: rgba(255, 255, 255, 0.8);

                      👥      font-size: 14px;

                    </div>      margin-top: 8px;

                        }

                    <!-- Nombre del equipo -->    

                    <h2 style="font-size: 28px; font-weight: 700; color: #0b0f19; margin: 0 0 12px 0;">    .email-body {

                      {{TEAM_NAME}}      padding: 48px 32px;

                    </h2>    }

                        

                    <!-- Texto de invitación -->    .greeting {

                    <p style="font-size: 16px; color: #475569; margin: 0 0 8px 0;">      font-size: 24px;

                      <strong style="color: #0f172a;">{{INVITER_NAME}}</strong> te ha invitado a formar parte de este equipo      font-weight: 600;

                    </p>      color: #0f172a;

                          margin-bottom: 24px;

                    <p style="font-size: 14px; color: #64748b; margin: 16px 0 32px 0;">    }

                      Correo de invitación: <strong>{{INVITED_EMAIL}}</strong>    

                    </p>    .invitation-card {

                          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);

                    <!-- Botón de aceptar (compatible con Gmail) -->      border: 1px solid #e2e8f0;

                    <table align="center" cellpadding="0" cellspacing="0" border="0">      border-radius: 16px;

                      <tr>      padding: 32px;

                        <td style="background-color: #0b0f19; border-radius: 12px; box-shadow: 0 4px 12px rgba(11, 15, 25, 0.2);">      margin: 32px 0;

                          <a href="{{ACCEPT_URL}}" style="display: inline-block; padding: 16px 48px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 12px;">      text-align: center;

                            Aceptar invitación    }

                          </a>    

                        </td>    .invitation-icon {

                      </tr>      width: 64px;

                    </table>      height: 64px;

                          background: linear-gradient(135deg, #0b0f19 0%, #1a1f2e 100%);

                  </td>      border-radius: 50%;

                </tr>      display: inline-flex;

              </table>      align-items: center;

                    justify-content: center;

              <!-- Línea divisoria -->      margin-bottom: 20px;

              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">      box-shadow: 0 4px 12px rgba(11, 15, 25, 0.15);

                  }

              <!-- Sección informativa -->    

              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border-left: 4px solid #0b0f19; border-radius: 8px; margin: 32px 0;">    .invitation-icon::after {

                <tr>      content: "👥";

                  <td style="padding: 20px 24px;">      font-size: 32px;

                    <h3 style="font-size: 14px; font-weight: 600; color: #0f172a; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.5px;">    }

                      ¿Qué significa esto?    

                    </h3>    .team-name {

                    <p style="font-size: 14px; color: #64748b; margin: 0 0 12px 0; line-height: 1.6;">      font-size: 28px;

                      Al aceptar esta invitación, podrás:      font-weight: 700;

                    </p>      color: #0b0f19;

                    <table cellpadding="0" cellspacing="0" border="0">      margin-bottom: 12px;

                      <tr>      letter-spacing: -0.5px;

                        <td style="padding: 4px 0;">    }

                          <span style="color: #0b0f19; font-weight: bold; margin-right: 8px;">✓</span>    

                          <span style="font-size: 14px; color: #475569;">Colaborar con otros miembros del equipo</span>    .invitation-text {

                        </td>      font-size: 16px;

                      </tr>      color: #475569;

                      <tr>      margin-bottom: 8px;

                        <td style="padding: 4px 0;">    }

                          <span style="color: #0b0f19; font-weight: bold; margin-right: 8px;">✓</span>    

                          <span style="font-size: 14px; color: #475569;">Acceder a proyectos y recursos compartidos</span>    .inviter-name {

                        </td>      font-weight: 600;

                      </tr>      color: #0f172a;

                      <tr>    }

                        <td style="padding: 4px 0;">    

                          <span style="color: #0b0f19; font-weight: bold; margin-right: 8px;">✓</span>    .cta-button {

                          <span style="font-size: 14px; color: #475569;">Participar en la gestión del equipo</span>      display: inline-block;

                        </td>      background: linear-gradient(135deg, #0b0f19 0%, #1a1f2e 100%);

                      </tr>      color: #ffffff;

                      <tr>      font-size: 16px;

                        <td style="padding: 4px 0;">      font-weight: 600;

                          <span style="color: #0b0f19; font-weight: bold; margin-right: 8px;">✓</span>      text-decoration: none;

                          <span style="font-size: 14px; color: #475569;">Compartir tu perfil profesional con el equipo</span>      padding: 16px 48px;

                        </td>      border-radius: 12px;

                      </tr>      margin-top: 32px;

                    </table>      transition: transform 0.2s ease, box-shadow 0.2s ease;

                  </td>      box-shadow: 0 4px 12px rgba(11, 15, 25, 0.2);

                </tr>    }

              </table>    

                  .cta-button:hover {

              <p style="font-size: 14px; color: #64748b; margin: 32px 0 0 0; line-height: 1.6;">      transform: translateY(-2px);

                Si no esperabas esta invitación o crees que fue enviada por error,       box-shadow: 0 6px 16px rgba(11, 15, 25, 0.3);

                puedes ignorar este correo de forma segura.    }

              </p>    

                  .info-section {

            </td>      background-color: #f8fafc;

          </tr>      border-left: 4px solid #0b0f19;

                padding: 20px 24px;

          <!-- Footer -->      margin: 32px 0;

          <tr>      border-radius: 8px;

            <td style="background-color: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #e2e8f0;">    }

              <p style="font-size: 13px; color: #64748b; margin: 0 0 8px 0;">    

                Este correo fue enviado desde <strong>Bridge</strong>    .info-title {

              </p>      font-size: 14px;

              <p style="font-size: 13px; color: #64748b; margin: 0;">      font-weight: 600;

                © 2025 Bridge. Todos los derechos reservados.      color: #0f172a;

              </p>      margin-bottom: 8px;

            </td>      text-transform: uppercase;

          </tr>      letter-spacing: 0.5px;

              }

        </table>    

      </td>    .info-text {

    </tr>      font-size: 14px;

  </table>      color: #64748b;

</body>      line-height: 1.6;

</html>`;    }

    

function buildBodies({ teamName, inviterName, invitedEmail, acceptUrl, message }) {    .info-list {

  const subject = `Invitación al equipo ${teamName} - Bridge`;      list-style: none;

        padding-left: 0;

  // Versión texto plano (fallback)      margin-top: 12px;

  const text = [    }

    `Bridge - Invitación a equipo`,    

    ``,    .info-list li {

    `¡Hola!`,      padding-left: 24px;

    ``,      position: relative;

    `${inviterName} te ha invitado a unirte al equipo "${teamName}" en Bridge.`,      margin-bottom: 8px;

    ``,      color: #475569;

    `Correo de invitación: ${invitedEmail}`,      font-size: 14px;

    ``,    }

    `Para aceptar la invitación, haz clic en el siguiente enlace:`,    

    acceptUrl,    .info-list li::before {

    ``,      content: "✓";

    message ? `Mensaje del invitador: ${message}\n` : "",      position: absolute;

    `¿Qué significa esto?`,      left: 0;

    `Al aceptar esta invitación, podrás:`,      color: #0b0f19;

    `- Colaborar con otros miembros del equipo`,      font-weight: bold;

    `- Acceder a proyectos y recursos compartidos`,    }

    `- Participar en la gestión del equipo`,    

    `- Compartir tu perfil profesional con el equipo`,    .email-footer {

    ``,      background-color: #f8fafc;

    `Si no esperabas esta invitación o crees que fue enviada por error,`,      padding: 32px;

    `puedes ignorar este correo de forma segura.`,      text-align: center;

    ``,      border-top: 1px solid #e2e8f0;

    `© 2025 Bridge. Todos los derechos reservados.`,    }

  ].join("\n");    

    .footer-text {

  // Reemplazar variables en el template HTML      font-size: 13px;

  const html = EMAIL_TEMPLATE      color: #64748b;

    .replace(/{{TEAM_NAME}}/g, escapeHtml(teamName))      margin-bottom: 8px;

    .replace(/{{INVITER_NAME}}/g, escapeHtml(inviterName))    }

    .replace(/{{INVITED_EMAIL}}/g, escapeHtml(invitedEmail))    

    .replace(/{{ACCEPT_URL}}/g, acceptUrl);    .footer-link {

      color: #0b0f19;

  return { subject, text, html };      text-decoration: none;

}      font-weight: 500;

    }

export async function sendTeamInviteEmail({ to, teamName, inviterName, acceptUrl, message }) {    

  const { subject, text, html } = buildBodies({     .footer-link:hover {

    teamName,       text-decoration: underline;

    inviterName,     }

    invitedEmail: to,    

    acceptUrl,     .divider {

    message       height: 1px;

  });      background: linear-gradient(to right, transparent, #e2e8f0, transparent);

      margin: 32px 0;

  // Fuerza destinatario en dev si está configurado (para evitar el 403 sandbox)    }

  let toList = Array.isArray(to) ? to : [to];    

  if (RESEND_DEV_FORCE_TO) {    @media only screen and (max-width: 600px) {

    console.log(`[mailer] 🔄 Redirigiendo email de ${to} a ${RESEND_DEV_FORCE_TO} (dev mode)`);      .email-body {

    toList = [RESEND_DEV_FORCE_TO];        padding: 32px 20px;

  }      }

      

  const { data, error } = await resend.emails.send({      .invitation-card {

    from: RESEND_FROM,        padding: 24px 20px;

    to: toList,      }

    subject,      

    text,      .greeting {

    html,        font-size: 20px;

  });      }

      

  if (error) {      .team-name {

    console.error("[mailer] ❌ Resend error:", error);        font-size: 24px;

    throw new Error(error.message || "Resend error");      }

  }      

      .cta-button {

  console.log(`[mailer] ✅ Email enviado exitosamente. ID: ${data?.id}`);        padding: 14px 32px;

  return { id: data?.id, provider: "resend" };        font-size: 15px;

}      }

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

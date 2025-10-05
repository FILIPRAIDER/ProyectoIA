// src/lib/mailer.js
import { Resend } from "resend";

const { RESEND_API_KEY, RESEND_FROM, RESEND_DEV_FORCE_TO } = process.env;

if (!RESEND_API_KEY) console.warn("[mailer] Falta RESEND_API_KEY en .env");
if (!RESEND_FROM) console.warn("[mailer] Falta RESEND_FROM en .env (ej: 'Acme <onboarding@resend.dev>')");

const resend = new Resend(RESEND_API_KEY);

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (m) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[m]));
}

function buildBodies({ teamName, acceptUrl, message }) {
  const subject = `Invitación para unirte al equipo "${teamName}"`;
  const text = [
    `Te invitaron a unirte al equipo "${teamName}".`,
    message ? `\nMensaje: ${message}` : "",
    `\nAcepta la invitación aquí: ${acceptUrl}`,
    `\nSi no esperabas este correo, puedes ignorarlo.`,
  ].join("");

  const html = `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,Helvetica,Arial,sans-serif;line-height:1.5;">
    <h2 style="margin:0 0 12px;">Invitación a equipo</h2>
    <p>Te invitaron a unirte al equipo <strong>${escapeHtml(teamName)}</strong>.</p>
    ${message ? `<blockquote style="margin:12px 0;padding:8px 12px;background:#f6f6f7;border-left:3px solid #bbb;">${escapeHtml(message)}</blockquote>` : ""}
    <p>
      <a href="${acceptUrl}" style="display:inline-block;padding:10px 16px;border-radius:8px;text-decoration:none;background:#111;color:#fff;font-weight:600;">
        Aceptar invitación
      </a>
    </p>
    <p style="color:#666;">Si no esperabas este correo, puedes ignorarlo.</p>
  </div>`.trim();

  return { subject, text, html };
}

export async function sendTeamInviteEmail({ to, teamName, acceptUrl, message }) {
  const { subject, text, html } = buildBodies({ teamName, acceptUrl, message });

  // Fuerza destinatario en dev si está configurado (para evitar el 403 sandbox)
  let toList = Array.isArray(to) ? to : [to];
  if (RESEND_DEV_FORCE_TO) {
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
    console.error("[mailer] Resend error:", error);
    throw new Error(error.message || "Resend error");
  }

  return { id: data?.id, provider: "resend" };
}

// scripts/test-email.js
// Script para probar el envío de emails de invitación

import "../src/env.js";
import { sendTeamInviteEmail } from "../src/lib/mailer.js";

const testData = {
  to: process.env.RESEND_DEV_FORCE_TO || "freshcaps98@gmail.com",
  teamName: "Equipo Bridge Developers",
  inviterName: "Filip Raider",
  acceptUrl: "http://localhost:3000/join?token=test_token_" + Date.now(),
  message: "¡Te invito a unirte a nuestro equipo! Juntos podemos construir proyectos increíbles en Bridge.",
};

console.log("📧 Testing Email Invitations\n");
console.log("=".repeat(50));
console.log("Configuration:");
console.log("  RESEND_API_KEY:", process.env.RESEND_API_KEY ? "✅ Set" : "❌ Missing");
console.log("  RESEND_FROM:", process.env.RESEND_FROM || "❌ Missing");
console.log("  RESEND_DEV_FORCE_TO:", process.env.RESEND_DEV_FORCE_TO || "(none - using test email)");
console.log("=".repeat(50));
console.log("\nTest Data:");
console.log("  To:", testData.to);
console.log("  Team:", testData.teamName);
console.log("  Inviter:", testData.inviterName);
console.log("  Accept URL:", testData.acceptUrl);
console.log("  Message:", testData.message ? "Yes" : "No");
console.log("=".repeat(50));

async function testEmail() {
  try {
    console.log("\n🚀 Enviando email de prueba...\n");
    
    const result = await sendTeamInviteEmail(testData);
    
    console.log("✅ Email enviado exitosamente!");
    console.log("   Email ID:", result.id);
    console.log("   Provider:", result.provider);
    console.log("\n✨ Revisa tu bandeja de entrada:", testData.to);
    console.log("   (Puede tardar unos segundos en llegar)");
    
  } catch (error) {
    console.error("\n❌ Error al enviar email:");
    console.error("   Message:", error.message);
    console.error("   Stack:", error.stack);
    
    if (error.message.includes("API key")) {
      console.log("\n💡 Tip: Verifica que RESEND_API_KEY esté correctamente configurado");
    }
    if (error.message.includes("from")) {
      console.log("\n💡 Tip: Verifica que RESEND_FROM esté correctamente configurado");
      console.log("   Ejemplo: RESEND_FROM='Bridge <noreply@tudominio.com>'");
    }
    
    process.exit(1);
  }
}

testEmail();

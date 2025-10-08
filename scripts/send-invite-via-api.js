// scripts/send-invite-via-api.js
// Envía invitación usando el endpoint del backend que ya envía el email

async function sendInvite() {
  try {
    const teamId = "cmghgdtiv0002gu6zbruvqg4t";
    const payload = {
      email: "juanguillermogarcessantero@gmail.com",
      role: "MIEMBRO",
      byUserId: "cmghgdt9q0001gu6ze0fyd7hs",
      expiresInDays: 7  // Enviarlo explícitamente
    };
    
    console.log("\n🚀 Enviando invitación vía API...\n");
    console.log("  URL:", `https://proyectoia-backend.onrender.com/teams/${teamId}/invites`);
    console.log("  Payload:", JSON.stringify(payload, null, 2));
    
    const response = await fetch(`https://proyectoia-backend.onrender.com/teams/${teamId}/invites`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error("\n❌ Error del servidor:");
      console.error("  Status:", response.status);
      console.error("  Response:", JSON.stringify(data, null, 2));
      return;
    }
    
    console.log("\n✅ Invitación enviada exitosamente:");
    console.log("  ID:", data.id);
    console.log("  Email:", data.email);
    console.log("  Rol:", data.role);
    console.log("  Expira:", data.expiresAt);
    console.log("  Email enviado:", data.emailSent ? "✅ SÍ" : "❌ NO");
    console.log("\n🔗 URL de aceptación:");
    console.log("  ", data.acceptUrlExample);
    console.log("\n✅ La invitación fue enviada al correo:", payload.email);
    console.log("\n🎉 ¡Listo! El usuario debería recibir el email en unos segundos.\n");
    
  } catch (error) {
    console.error("\n❌ Error:", error.message);
  }
}

sendInvite();

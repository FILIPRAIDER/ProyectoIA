// scripts/test-invite-info.js
// Script para probar el endpoint de información de invitación

const TOKEN = process.argv[2] || "b5fabc1fd3dba6422b0a1a2f4ba150fd66a81d888e695234adaf3ee575e6fa63";
const API_URL = "http://localhost:4001";

async function testInviteInfo() {
  try {
    console.log("🧪 Testing Invite Info Endpoint");
    console.log("=".repeat(60));
    console.log("Token:", TOKEN);
    console.log("API URL:", API_URL);
    console.log("=".repeat(60));

    const url = `${API_URL}/teams/invites/${TOKEN}/info`;
    console.log("\n📡 GET", url);

    const response = await fetch(url);
    
    console.log("\n📊 Response Status:", response.status, response.statusText);

    if (!response.ok) {
      const error = await response.json();
      console.error("\n❌ Error:", error);
      return;
    }

    const data = await response.json();

    console.log("\n✅ Invitación Encontrada:");
    console.log("=".repeat(60));
    
    console.log("\n📧 Información Básica:");
    console.log("  Token:", data.token.substring(0, 20) + "...");
    console.log("  Email:", data.email);
    console.log("  Rol:", data.role);
    console.log("  Estado:", data.status);
    console.log("  Puede aceptar:", data.canAccept ? "✅ Sí" : "❌ No");
    console.log("  Expirada:", data.isExpired ? "❌ Sí" : "✅ No");

    if (data.message) {
      console.log("\n💬 Mensaje:");
      console.log(" ", data.message);
    }

    console.log("\n👥 Equipo:");
    console.log("  ID:", data.team.id);
    console.log("  Nombre:", data.team.name);
    console.log("  Descripción:", data.team.description || "(sin descripción)");
    console.log("  Área:", data.team.area || "(sin área)");
    console.log("  Miembros:", data.memberCount);

    if (data.inviter) {
      console.log("\n👤 Invitador:");
      console.log("  Nombre:", data.inviter.name);
      console.log("  Email:", data.inviter.email);
    }

    console.log("\n📅 Fechas:");
    console.log("  Creada:", new Date(data.createdAt).toLocaleString());
    console.log("  Expira:", new Date(data.expiresAt).toLocaleString());

    console.log("\n" + "=".repeat(60));

    if (data.canAccept) {
      console.log("\n✅ Esta invitación puede ser aceptada");
      console.log("\n📝 Para aceptarla:");
      console.log(`   POST ${API_URL}/teams/invites/${TOKEN}/accept`);
      console.log('   { "name": "Tu Nombre" }');
    } else {
      console.log("\n⚠️  Esta invitación NO puede ser aceptada");
      console.log("   Razón:", 
        data.isExpired ? "Ha expirado" :
        data.status === "ACCEPTED" ? "Ya fue aceptada" :
        data.status === "CANCELED" ? "Fue cancelada" :
        "Estado inválido"
      );
    }

    console.log("\n" + "=".repeat(60));
    console.log("\n📱 Frontend puede usar esta info para:");
    console.log("  1. Mostrar nombre del equipo");
    console.log("  2. Mostrar quién invitó");
    console.log("  3. Mostrar cuántos miembros hay");
    console.log("  4. Decidir si mostrar botón de aceptar");
    console.log("  5. Mostrar mensaje de error si no se puede aceptar");

  } catch (error) {
    console.error("\n❌ Error:", error.message);
  }
}

testInviteInfo();

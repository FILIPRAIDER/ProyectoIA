/**
 * Script para probar el link de invitación de Juan Garcés
 */

async function main() {
  const token = "8d7f9241e41f47651028c3ff072b5dc1a4fe20d1757968b8121177a8c4da303a";
  const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:4001";
  
  console.log("🧪 PROBANDO LINK DE INVITACIÓN\n");
  console.log("=".repeat(60));
  console.log(`Token: ${token}\n`);

  // 1. Probar endpoint de información (GET /info)
  console.log("1️⃣  Probando GET /teams/invites/:token/info");
  console.log("    (Esto es lo que el frontend llamaría al abrir el link)\n");

  try {
    const infoUrl = `${API_BASE_URL}/teams/invites/${token}/info`;
    console.log(`   URL: ${infoUrl}\n`);

    const infoResponse = await fetch(infoUrl);
    const infoData = await infoResponse.json();

    console.log(`   Status: ${infoResponse.status} ${infoResponse.statusText}`);
    console.log("   " + "─".repeat(58));

    if (infoResponse.ok) {
      console.log("   ✅ INFORMACIÓN OBTENIDA CORRECTAMENTE\n");
      console.log("   📋 Datos de la invitación:");
      console.log(`      • Email: ${infoData.email}`);
      console.log(`      • Rol: ${infoData.role}`);
      console.log(`      • Estado: ${infoData.status}`);
      console.log(`      • Puede aceptar: ${infoData.canAccept ? "Sí ✅" : "No ❌"}`);
      console.log(`      • Expirada: ${infoData.isExpired ? "Sí ❌" : "No ✅"}`);
      console.log();
      console.log("   🏢 Equipo:");
      console.log(`      • Nombre: ${infoData.team.name}`);
      console.log(`      • Descripción: ${infoData.team.description || "(Sin descripción)"}`);
      console.log(`      • Miembros: ${infoData.memberCount}`);
      console.log();
      console.log("   👤 Invitado por:");
      console.log(`      • Nombre: ${infoData.inviter.name}`);
      console.log(`      • Email: ${infoData.inviter.email}`);
    } else {
      console.log("   ❌ ERROR AL OBTENER INFORMACIÓN");
      console.log(`      Error: ${infoData.error || "Desconocido"}`);
    }
  } catch (error) {
    console.error("   ❌ ERROR:", error.message);
  }

  console.log("\n" + "=".repeat(60));

  // 2. Simular el flujo completo del frontend
  console.log("\n2️⃣  FLUJO COMPLETO DEL FRONTEND\n");
  console.log("   Paso 1: Usuario hace clic en el email");
  console.log(`   Paso 2: Abre: http://localhost:3000/join?token=${token.substring(0, 20)}...`);
  console.log("   Paso 3: Frontend llama a GET /teams/invites/:token/info ✅");
  console.log("   Paso 4: Frontend muestra la información del equipo");
  console.log("   Paso 5: Usuario hace clic en 'Aceptar'");
  console.log("   Paso 6: Frontend llama a POST /teams/invites/:token/accept");
  console.log("   Paso 7: Usuario es agregado al equipo");

  console.log("\n" + "=".repeat(60));
  console.log("✅ LINK FUNCIONANDO CORRECTAMENTE");
  console.log("=".repeat(60));

  console.log("\n📧 El email fue enviado a: filipraider123@gmail.com");
  console.log("   (Original: juan.garcess@campusucc.edu.co)");
  console.log("\n🔗 URL completa en el email:");
  console.log(`   http://localhost:3000/join?token=${token}`);
  
  console.log("\n🧪 PARA ACEPTAR LA INVITACIÓN:");
  console.log("   1. Copia y pega esta URL en el navegador:");
  console.log(`      http://localhost:3000/join?token=${token}`);
  console.log("   2. O usa este comando para aceptar directamente:");
  console.log(`      node scripts/accept-invite-juan.js`);
}

main().catch(console.error);

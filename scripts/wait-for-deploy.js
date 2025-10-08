/**
 * Script para verificar cuando el endpoint de invitaciones esté disponible en producción
 */

const BACKEND_URL = "https://proyectoia-backend.onrender.com";
const TOKEN = "8d7f9241e41f47651028c3ff072b5dc1a4fe20d1757968b8121177a8c4da303a";

async function checkEndpoint() {
  const url = `${BACKEND_URL}/teams/invites/${TOKEN}/info`;
  
  console.log("🔍 Verificando endpoint en producción...");
  console.log(`   URL: ${url}\n`);

  try {
    const response = await fetch(url);
    
    if (response.ok) {
      const data = await response.json();
      console.log("✅ ¡ENDPOINT FUNCIONANDO!\n");
      console.log("📋 Datos de la invitación:");
      console.log(`   Email: ${data.email}`);
      console.log(`   Rol: ${data.role}`);
      console.log(`   Estado: ${data.status}`);
      console.log(`   Puede aceptar: ${data.canAccept ? "Sí ✅" : "No ❌"}`);
      console.log(`   Equipo: ${data.team.name}`);
      console.log(`   Invitado por: ${data.inviter.name}`);
      console.log("\n🎉 El link de invitación ahora funcionará correctamente");
      return true;
    } else if (response.status === 404) {
      console.log("⏳ Endpoint aún no disponible (404)");
      console.log("   Render está desplegando la nueva versión...");
      return false;
    } else {
      console.log(`⚠️  Respuesta inesperada: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log("❌ Error de conexión:", error.message);
    return false;
  }
}

async function waitForDeploy() {
  console.log("🚀 ESPERANDO DEPLOY DE RENDER\n");
  console.log("=".repeat(60));
  console.log("Render está desplegando los nuevos cambios...");
  console.log("Esto puede tardar 2-3 minutos.\n");

  let attempts = 0;
  const maxAttempts = 30; // 5 minutos máximo

  while (attempts < maxAttempts) {
    attempts++;
    console.log(`\n[Intento ${attempts}/${maxAttempts}]`);
    
    const isReady = await checkEndpoint();
    
    if (isReady) {
      console.log("\n" + "=".repeat(60));
      console.log("✅ DEPLOY COMPLETADO - SISTEMA LISTO");
      console.log("=".repeat(60));
      console.log("\n🔗 Ahora puedes probar el link:");
      console.log(`   http://localhost:3000/join?token=${TOKEN}`);
      return;
    }

    if (attempts < maxAttempts) {
      console.log("   Esperando 10 segundos...");
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }

  console.log("\n⏱️  Tiempo de espera agotado.");
  console.log("Verifica manualmente en: https://dashboard.render.com/");
}

waitForDeploy();

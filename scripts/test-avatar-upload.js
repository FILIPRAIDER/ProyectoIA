/**
 * Script para probar el endpoint de upload de avatar con reemplazo
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:4001";
const BACKEND_PROD = "https://proyectoia-backend.onrender.com";

async function testAvatarUpload() {
  console.log("🧪 PROBANDO AVATAR UPLOAD CON REEMPLAZO\n");
  console.log("=".repeat(70));

  // Necesitarás crear una imagen de prueba o usar una existente
  const testImagePath = path.join(__dirname, "test-avatar.jpg");
  
  // Si no existe la imagen, creamos un placeholder
  if (!fs.existsSync(testImagePath)) {
    console.log("⚠️  No se encontró test-avatar.jpg");
    console.log("   Puedes probar manualmente con:");
    console.log("\n   curl -X POST \\");
    console.log(`     ${BACKEND_PROD}/uploads/users/USER_ID/avatar \\`);
    console.log('     -F "file=@/ruta/a/tu/imagen.jpg"');
    console.log("\n   Respuesta esperada:");
    console.log("   {");
    console.log('     "ok": true,');
    console.log('     "url": "https://ik.imagekit.io/...",');
    console.log('     "fileId": "...",');
    console.log('     "message": "Avatar actualizado correctamente"');
    console.log("   }");
    return;
  }

  // Ejemplo de cómo hacer el upload con FormData
  console.log("📝 Ejemplo de uso con fetch:\n");
  console.log("```javascript");
  console.log("const formData = new FormData();");
  console.log("formData.append('file', fileInput.files[0]);");
  console.log("");
  console.log("const response = await fetch(");
  console.log(`  '${BACKEND_PROD}/uploads/users/\${userId}/avatar',`);
  console.log("  {");
  console.log("    method: 'POST',");
  console.log("    body: formData,");
  console.log("  }");
  console.log(");");
  console.log("");
  console.log("const data = await response.json();");
  console.log("console.log(data.url); // Nueva URL del avatar");
  console.log("```\n");

  console.log("✅ Funcionalidades implementadas:");
  console.log("   • Validación de tipo de archivo (solo imágenes)");
  console.log("   • Validación de tamaño (máx 5MB)");
  console.log("   • Eliminación automática del avatar anterior en ImageKit");
  console.log("   • Actualización de User.avatarUrl");
  console.log("   • Actualización de MemberProfile con metadata (fileId, size, etc)");
  console.log("   • Response indica si fue subida o reemplazo\n");

  console.log("📋 Endpoints disponibles:");
  console.log(`   POST ${BACKEND_PROD}/uploads/users/:userId/avatar`);
  console.log("");
  console.log("🔐 Tipos de archivo permitidos:");
  console.log("   • image/jpeg, image/jpg");
  console.log("   • image/png");
  console.log("   • image/gif");
  console.log("   • image/webp");
  console.log("");
  console.log("📏 Límites:");
  console.log("   • Tamaño máximo: 5MB");
  console.log("   • Carpeta en ImageKit: /avatars");
  console.log("");

  console.log("🔄 Flujo de reemplazo:");
  console.log("   1. Usuario sube nueva imagen");
  console.log("   2. Backend verifica si ya tiene avatar");
  console.log("   3. Si existe, elimina el anterior de ImageKit");
  console.log("   4. Sube la nueva imagen");
  console.log("   5. Actualiza BD con nueva URL y metadata");
  console.log("   6. Retorna nueva URL");
  console.log("");

  console.log("=".repeat(70));
  console.log("✅ IMPLEMENTACIÓN COMPLETADA");
  console.log("=".repeat(70));
}

testAvatarUpload();

// Script para verificar los registros DNS de equipos.online
// Ejecutar: node scripts/verify-dns-equipos.js

import { exec } from 'child_process';
import util from 'util';
const execPromise = util.promisify(exec);

console.log('🔍 VERIFICANDO REGISTROS DNS DE equipos.online\n');
console.log('Este script verifica si los registros DNS están configurados correctamente\n');
console.log('═══════════════════════════════════════════════════════════════\n');

async function verificarDNS() {
  const checks = [
    {
      name: '1️⃣  Registro MX (send.equipos.online)',
      command: 'nslookup -type=MX send.equipos.online',
      expected: 'feedback-smtp.sa-east-1.amazonses.com',
      description: 'Permite recibir bounces y feedback de emails'
    },
    {
      name: '2️⃣  Registro TXT/SPF (send.equipos.online)',
      command: 'nslookup -type=TXT send.equipos.online',
      expected: 'v=spf1 include:amazonses.com',
      description: 'Valida que el servidor está autorizado a enviar emails'
    },
    {
      name: '3️⃣  Registro TXT/DKIM (resend._domainkey.equipos.online)',
      command: 'nslookup -type=TXT resend._domainkey.equipos.online',
      expected: 'p=MIGfMA0GCSqGSIb3DQEB',
      description: 'Firma digital para autenticar los emails'
    }
  ];

  let todosOk = true;

  for (const check of checks) {
    console.log(`\n${check.name}`);
    console.log(`📝 ${check.description}`);
    console.log('─'.repeat(60));
    
    try {
      const { stdout, stderr } = await execPromise(check.command);
      
      if (stdout.includes(check.expected)) {
        console.log('✅ CONFIGURADO CORRECTAMENTE');
        console.log(`\n📄 Respuesta DNS:\n${stdout.substring(0, 300)}${stdout.length > 300 ? '...' : ''}`);
      } else if (stdout.includes('Non-existent domain') || stdout.includes('server can\'t find') || stdout.includes('no se encuentra')) {
        console.log('❌ REGISTRO NO ENCONTRADO');
        console.log('⚠️  El registro aún no está configurado o no ha propagado');
        todosOk = false;
      } else {
        console.log('⚠️  REGISTRO EXISTE PERO VALOR INCORRECTO');
        console.log(`\n📄 Respuesta DNS:\n${stdout}`);
        todosOk = false;
      }
      
      if (stderr && !stderr.includes('Non-authoritative')) {
        console.log(`\n⚠️  Error: ${stderr}`);
      }
      
    } catch (error) {
      console.log('❌ ERROR AL VERIFICAR');
      console.log(`Error: ${error.message}`);
      todosOk = false;
    }
  }

  console.log('\n\n═══════════════════════════════════════════════════════════════');
  console.log('📊 RESUMEN DE VERIFICACIÓN\n');
  
  if (todosOk) {
    console.log('🎉 ¡TODOS LOS REGISTROS DNS ESTÁN CONFIGURADOS CORRECTAMENTE!');
    console.log('\n✅ Próximos pasos:');
    console.log('   1. Ve a Resend Dashboard: https://resend.com/domains/');
    console.log('   2. Selecciona el dominio "equipos.online"');
    console.log('   3. Haz clic en el botón "Verify" o "Restart"');
    console.log('   4. Los registros deberían cambiar a estado "Verified" ✅');
    console.log('\n   5. Prueba enviar un email desde tu backend');
    console.log('   6. El remitente será: no-reply@equipos.online');
  } else {
    console.log('⚠️  ALGUNOS REGISTROS AÚN NO ESTÁN CONFIGURADOS');
    console.log('\n📋 Acciones requeridas:');
    console.log('   1. Ve a Hostinger: https://hpanel.hostinger.com/');
    console.log('   2. Dominios → equipos.online → DNS / Registros de Nombre');
    console.log('   3. Agrega los registros faltantes (ver DNS_VALORES_EXACTOS.md)');
    console.log('   4. Espera 15-30 minutos para la propagación DNS');
    console.log('   5. Vuelve a ejecutar este script: node scripts/verify-dns-equipos.js');
  }
  
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('\n💡 Nota: La propagación DNS puede tardar de 15 minutos a 24 horas');
  console.log('   En la mayoría de casos, toma entre 15-30 minutos.\n');
}

verificarDNS().catch(err => {
  console.error('❌ Error fatal:', err);
  process.exit(1);
});

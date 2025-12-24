/**
 * Script de Prueba Automatizado para la API
 * Ejecutar con: node test-api.js
 */

const BASE_URL = 'http://localhost:3000';

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Función para hacer requests
async function request(method, endpoint, data = null, token = null) {
  const url = `${BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const result = await response.json();
    return {
      status: response.status,
      ok: response.ok,
      data: result,
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message,
    };
  }
}

// Función para esperar
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
  log('\n🧪 Iniciando Pruebas de la API...\n', 'cyan');

  let tokens = {
    secretaria: null,
    medico: null,
    admin: null,
  };

  // ============================================
  // 1. TEST: Health Check
  // ============================================
  log('📋 Test 1: Health Check', 'blue');
  const health = await request('GET', '/health');
  if (health.ok) {
    log('  ✅ Health check OK', 'green');
    log(`  📊 Status: ${health.data.status}`, 'green');
  } else {
    log('  ❌ Health check FAILED', 'red');
  }
  console.log('');

  // ============================================
  // 2. TEST: Login Secretaria
  // ============================================
  log('📋 Test 2: Login Secretaria', 'blue');
  const loginSecretaria = await request('POST', '/auth/login', {
    email: 'secretaria@consultorio.com',
    password: 'secretaria123',
  });

  if (loginSecretaria.ok && loginSecretaria.data.access_token) {
    tokens.secretaria = loginSecretaria.data.access_token;
    log('  ✅ Login secretaria OK', 'green');
    log(`  🔑 Token obtenido`, 'green');
  } else {
    log('  ❌ Login secretaria FAILED', 'red');
    log(`  Error: ${JSON.stringify(loginSecretaria.data)}`, 'red');
  }
  console.log('');

  // ============================================
  // 3. TEST: Login Médico
  // ============================================
  log('📋 Test 3: Login Médico', 'blue');
  const loginMedico = await request('POST', '/auth/login', {
    email: 'medico@consultorio.com',
    password: 'medico123',
  });

  if (loginMedico.ok && loginMedico.data.access_token) {
    tokens.medico = loginMedico.data.access_token;
    log('  ✅ Login médico OK', 'green');
    log(`  🔑 Token obtenido`, 'green');
  } else {
    log('  ❌ Login médico FAILED', 'red');
    log(`  Error: ${JSON.stringify(loginMedico.data)}`, 'red');
  }
  console.log('');

  // ============================================
  // 4. TEST: Enviar Paciente a Sala de Espera
  // ============================================
  log('📋 Test 4: Enviar Paciente a Sala de Espera', 'blue');
  const enviarPaciente = await request(
    'POST',
    '/pacientes/espera',
    {
      dni: '99999999',
      nombre: 'Test',
      apellido: 'Paciente',
      obraSocial: 'OSDE',
      medicoId: 1,
      telefono: '1234567890',
    },
    tokens.secretaria
  );

  if (enviarPaciente.ok) {
    log('  ✅ Paciente enviado a sala de espera OK', 'green');
    log(`  👤 Paciente ID: ${enviarPaciente.data.paciente?.id}`, 'green');
    log(`  ⏰ Atención ID: ${enviarPaciente.data.atencion?.id}`, 'green');
    log(`  📊 Estado: ${enviarPaciente.data.atencion?.estado}`, 'green');
  } else {
    log('  ❌ Enviar paciente FAILED', 'red');
    log(`  Error: ${JSON.stringify(enviarPaciente.data)}`, 'red');
  }
  console.log('');

  // ============================================
  // 5. TEST: Ver Pacientes en Espera
  // ============================================
  log('📋 Test 5: Ver Pacientes en Espera (Médico)', 'blue');
  const pacientesEspera = await request(
    'GET',
    '/atenciones/activas',
    null,
    tokens.medico
  );

  if (pacientesEspera.ok) {
    log('  ✅ Obtener pacientes en espera OK', 'green');
    log(`  📊 Total en espera: ${pacientesEspera.data?.length || 0}`, 'green');
    if (pacientesEspera.data?.length > 0) {
      pacientesEspera.data.forEach((atencion, index) => {
        log(
          `  ${index + 1}. ${atencion.paciente?.nombre} ${atencion.paciente?.apellido} (DNI: ${atencion.paciente?.dni})`,
          'green'
        );
      });
    }
  } else {
    log('  ❌ Obtener pacientes en espera FAILED', 'red');
    log(`  Error: ${JSON.stringify(pacientesEspera.data)}`, 'red');
  }
  console.log('');

  // ============================================
  // 6. TEST: Llamar Paciente (si hay alguno en espera)
  // ============================================
  if (pacientesEspera.ok && pacientesEspera.data?.length > 0) {
    const atencionId = pacientesEspera.data[0].id;
    log(`📋 Test 6: Llamar Paciente (Atención ID: ${atencionId})`, 'blue');
    
    await sleep(1000); // Esperar 1 segundo
    
    const llamarPaciente = await request(
      'PATCH',
      `/atenciones/${atencionId}/atender`,
      null,
      tokens.medico
    );

    if (llamarPaciente.ok) {
      log('  ✅ Paciente llamado OK', 'green');
      log(`  📊 Nuevo estado: ${llamarPaciente.data?.estado}`, 'green');
      log(`  ⏰ Hora atención: ${llamarPaciente.data?.horaAtencion || 'N/A'}`, 'green');
    } else {
      log('  ❌ Llamar paciente FAILED', 'red');
      log(`  Error: ${JSON.stringify(llamarPaciente.data)}`, 'red');
    }
    console.log('');

    // ============================================
    // 7. TEST: Crear Historia Clínica
    // ============================================
    log('📋 Test 7: Crear Historia Clínica', 'blue');
    const historiaClinica = await request(
      'POST',
      '/historias-clinicas',
      {
        atencionId: atencionId,
        motivoConsulta: 'Control de rutina',
        sintomas: 'Paciente asintomático',
        diagnostico: 'Paciente sano',
        tratamiento: 'Continuar con hábitos saludables',
        presionArterial: '120/80',
        temperatura: '36.5',
        peso: 75.5,
        altura: 1.75,
      },
      tokens.medico
    );

    if (historiaClinica.ok) {
      log('  ✅ Historia clínica creada OK', 'green');
      log(`  📋 Historia ID: ${historiaClinica.data?.id}`, 'green');
      log(`  📊 Estado atención: ${historiaClinica.data?.atencion?.estado}`, 'green');
    } else {
      log('  ❌ Crear historia clínica FAILED', 'red');
      log(`  Error: ${JSON.stringify(historiaClinica.data)}`, 'red');
    }
    console.log('');
  }

  // ============================================
  // 8. TEST: Buscar Paciente por DNI
  // ============================================
  log('📋 Test 8: Buscar Paciente por DNI', 'blue');
  const buscarPaciente = await request(
    'GET',
    '/pacientes/search?dni=99999999',
    null,
    tokens.secretaria
  );

  if (buscarPaciente.ok) {
    log('  ✅ Búsqueda de paciente OK', 'green');
    if (buscarPaciente.data) {
      log(`  👤 Encontrado: ${buscarPaciente.data.nombre} ${buscarPaciente.data.apellido}`, 'green');
    } else {
      log('  ⚠️  Paciente no encontrado', 'yellow');
    }
  } else {
    log('  ❌ Búsqueda de paciente FAILED', 'red');
    log(`  Error: ${JSON.stringify(buscarPaciente.data)}`, 'red');
  }
  console.log('');

  // ============================================
  // RESUMEN
  // ============================================
  log('\n📊 RESUMEN DE PRUEBAS\n', 'cyan');
  log('✅ Tests completados', 'green');
  log('📝 Revisa los resultados arriba para ver qué funcionó y qué no', 'yellow');
  log('\n💡 Tip: Si algún test falló, verifica:', 'yellow');
  log('   1. Que el servidor esté corriendo (npm run start:dev)', 'yellow');
  log('   2. Que la base de datos esté conectada', 'yellow');
  log('   3. Que hayas ejecutado el seed (npm run prisma:seed)', 'yellow');
  log('\n');
}

// Ejecutar tests
runTests().catch(error => {
  log(`\n❌ Error fatal: ${error.message}`, 'red');
  log('💡 Asegúrate de que el servidor esté corriendo en http://localhost:3000', 'yellow');
  process.exit(1);
});





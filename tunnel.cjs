const { execSync } = require('child_process');

function run() {
  console.log('Iniciando o túnel para o PWA Mimu...');
  try {
    // Tenta executar o localtunnel com um subdomínio fixo
    execSync('npx localtunnel --port 4173 --subdomain mimu-test-osvaldo', { stdio: 'inherit' });
  } catch (error) {
    console.error('O túnel caiu ou não pôde ser iniciado. Reiniciando em 3 segundos...', error.message);
  }
  setTimeout(run, 3000);
}

run();

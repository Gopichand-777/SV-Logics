// scripts/kill-port.cjs
// Kills any process holding port 3001 before nodemon starts.
// Runs on Windows via: netstat -ano + taskkill
const { execSync } = require('child_process');

const PORT = 3001;

try {
  const output = execSync('netstat -ano', { encoding: 'utf8' });
  const lines = output.split('\n').filter(
    l => l.includes(`:${PORT} `) && l.includes('LISTENING')
  );
  lines.forEach(line => {
    const parts = line.trim().split(/\s+/);
    const pid = parts[parts.length - 1];
    if (pid && pid !== '0') {
      try {
        execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
        console.log(`[kill-port] Freed port ${PORT} (killed PID ${pid})`);
      } catch (_) {
        // already gone
      }
    }
  });
  if (lines.length === 0) {
    console.log(`[kill-port] Port ${PORT} is free. Starting…`);
  }
} catch (e) {
  // netstat not available (CI/Linux) — ignore
}

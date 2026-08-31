/**
 * ⚡ Second Brain AI - 24/7 Always-Running Supervisor, Tunnel & Bot Manager
 *
 * This supervisor daemon handles:
 * 1. Next.js Web App process management on port 3000
 * 2. Cloudflare Tunnel (via cloudflared) auto-launch & HTTPS URL extraction
 * 3. Automatic Telegram Bot Menu Button & Command registration via Telegram API
 * 4. Python Telegram Bot runner process management with live HTTPS URL
 * 5. Health monitoring (/api/health) and auto-recovery on crash
 */

const { spawn } = require('child_process');
const http = require('http');
const https = require('https');
const path = require('path');
const fs = require('fs');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const PORT = process.env.PORT || 3000;
const HEALTH_URL = `http://localhost:${PORT}/api/health`;
const PING_INTERVAL_MS = 15000; // 15 seconds
const MAX_FAILED_PINCS = 3;

let nextProcess = null;
let botProcess = null;
let tunnelProcess = null;
let currentPublicUrl = '';
let failedPings = 0;
let isShuttingDown = false;

function log(msg, type = 'INFO') {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const prefix = {
    INFO: '🔹 [INFO]',
    SUCCESS: '✅ [SUCCESS]',
    WARN: '⚠️ [WARN]',
    ERROR: '❌ [ERROR]',
    KEEP_ALIVE: '⚡ [KEEP-ALIVE]',
    TELEGRAM: '🤖 [TELEGRAM]',
    TUNNEL: '🌐 [TUNNEL]',
  }[type] || '[LOG]';

  console.log(`${prefix} ${timestamp} | ${msg}`);
}

// ── Load / Update .env.local ────────────────────────────────────────────────
function getEnvVal(key) {
  const envPath = path.join(PROJECT_ROOT, '.env.local');
  if (!fs.existsSync(envPath)) return '';
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [k, v] = trimmed.split('=', 2);
      if (k.trim() === key) {
        return v.trim().replace(/^["']|["']$/g, '');
      }
    }
  }
  return '';
}

function updateEnvUrl(newUrl) {
  const envPath = path.join(PROJECT_ROOT, '.env.local');
  if (!fs.existsSync(envPath)) return;
  let content = fs.readFileSync(envPath, 'utf8');
  if (content.includes('NEXT_PUBLIC_APP_URL=')) {
    content = content.replace(/NEXT_PUBLIC_APP_URL=.*$/m, `NEXT_PUBLIC_APP_URL="${newUrl}"`);
  } else {
    content += `\nNEXT_PUBLIC_APP_URL="${newUrl}"\n`;
  }
  fs.writeFileSync(envPath, content, 'utf8');
  log(`Updated .env.local NEXT_PUBLIC_APP_URL => ${newUrl}`, 'SUCCESS');
}

// ── Register Telegram Bot WebApp Menu Button ────────────────────────────────
function registerTelegramWebApp(publicUrl) {
  const token = getEnvVal('TELEGRAM_BOT_TOKEN') || '8877395712:AAFMXyeqy31c3fccZxVdRw45CIJ_aAefz3g';
  if (!token) return;

  log(`Registering Telegram Bot WebApp Menu Button for URL: ${publicUrl}`, 'TELEGRAM');

  // 1. Set Chat Menu Button (Native Telegram Mini App Menu Button)
  const menuPayload = JSON.stringify({
    menu_button: {
      type: 'web_app',
      text: '🧠 Second Brain Mini App',
      web_app: { url: publicUrl },
    },
  });

  const req1 = https.request(`https://api.telegram.org/bot${token}/setChatMenuButton`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(menuPayload) },
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => log(`setChatMenuButton response: ${data}`, 'TELEGRAM'));
  });
  req1.on('error', err => log(`Failed setChatMenuButton: ${err.message}`, 'WARN'));
  req1.write(menuPayload);
  req1.end();

  // 2. Set Commands
  const cmdPayload = JSON.stringify({
    commands: [
      { command: 'start', description: "🧠 Second Brain Mini App-ni ochish" },
      { command: 'help', description: "Yo'riqnoma va yordam" },
    ],
  });
  const req2 = https.request(`https://api.telegram.org/bot${token}/setMyCommands`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(cmdPayload) },
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => log(`setMyCommands response: ${data}`, 'TELEGRAM'));
  });
  req2.on('error', err => log(`Failed setMyCommands: ${err.message}`, 'WARN'));
  req2.write(cmdPayload);
  req2.end();
}

// ── 1. Start Next.js Web Server Process ──────────────────────────────────────
function startNextServer() {
  if (isShuttingDown) return;
  log('Starting Next.js Web Application process...', 'INFO');

  const isWin = process.platform === 'win32';
  const npmCmd = isWin ? 'npm.cmd' : 'npm';
  const isProd = fs.existsSync(path.join(PROJECT_ROOT, '.next', 'BUILD_ID'));
  const scriptName = isProd ? 'start' : 'dev';

  log(`Executing ${npmCmd} run ${scriptName} (Mode: ${isProd ? 'PRODUCTION' : 'DEVELOPMENT'})`, 'INFO');

  nextProcess = spawn(npmCmd, ['run', scriptName], {
    cwd: PROJECT_ROOT,
    stdio: 'pipe',
    shell: true,
    env: { ...process.env, PORT: String(PORT) },
  });

  nextProcess.stdout.on('data', (data) => {
    const line = data.toString().trim();
    if (line) console.log(`[Next.js] ${line}`);
  });

  nextProcess.stderr.on('data', (data) => {
    const line = data.toString().trim();
    if (line) console.error(`[Next.js Error] ${line}`);
  });

  nextProcess.on('exit', (code, signal) => {
    log(`Next.js process exited (code ${code}, signal ${signal})`, 'WARN');
    nextProcess = null;
    if (!isShuttingDown) {
      log('Auto-restarting Next.js in 3 seconds...', 'WARN');
      setTimeout(startNextServer, 3000);
    }
  });
}

// ── 2. Start Cloudflare Tunnel (via cloudflared CLI) ───────────────────────
function startTunnel() {
  if (isShuttingDown) return;
  log('Starting Cloudflare Tunnel via cloudflared...', 'TUNNEL');

  const isWin = process.platform === 'win32';
  const cmd = isWin ? 'npx.cmd' : 'npx';

  tunnelProcess = spawn(cmd, ['cloudflared', 'tunnel', '--url', `http://localhost:${PORT}`], {
    cwd: PROJECT_ROOT,
    stdio: 'pipe',
    shell: isWin,
  });

  const handleData = (data) => {
    const text = data.toString();
    const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
    if (match && match[0] && match[0] !== currentPublicUrl) {
      currentPublicUrl = match[0];
      log(`Cloudflare Tunnel Active! Live Public URL: ${currentPublicUrl}`, 'SUCCESS');
      updateEnvUrl(currentPublicUrl);
      registerTelegramWebApp(currentPublicUrl);
    }
  };

  tunnelProcess.stdout.on('data', handleData);
  tunnelProcess.stderr.on('data', handleData);

  tunnelProcess.on('exit', (code, signal) => {
    log(`Tunnel process exited (code ${code}, signal ${signal})`, 'WARN');
    tunnelProcess = null;
    if (!isShuttingDown) {
      log('Auto-restarting Tunnel in 5 seconds...', 'WARN');
      setTimeout(startTunnel, 5000);
    }
  });
}

// ── 3. Start Python Telegram Bot Process ─────────────────────────────────────
function startTelegramBot() {
  if (isShuttingDown) return;

  const botScript = path.join(PROJECT_ROOT, 'scripts', 'telegram_bot_runner.py');
  if (!fs.existsSync(botScript)) {
    log(`Telegram bot script not found at ${botScript}, skipping bot runner`, 'WARN');
    return;
  }

  log('Starting Python Telegram Bot runner...', 'TELEGRAM');
  const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';

  botProcess = spawn(pythonCmd, [botScript], {
    cwd: PROJECT_ROOT,
    stdio: 'pipe',
    shell: false, // Avoid space-splitting in Windows paths
    env: { ...process.env, NEXT_PUBLIC_APP_URL: currentPublicUrl },
  });

  botProcess.stdout.on('data', (data) => {
    const line = data.toString().trim();
    if (line) console.log(`[Telegram Bot] ${line}`);
  });

  botProcess.stderr.on('data', (data) => {
    const line = data.toString().trim();
    if (line) console.error(`[Telegram Bot Error] ${line}`);
  });

  botProcess.on('exit', (code, signal) => {
    log(`Telegram Bot process exited (code ${code}, signal ${signal})`, 'WARN');
    botProcess = null;
    if (!isShuttingDown) {
      log('Auto-restarting Telegram Bot in 5 seconds...', 'WARN');
      setTimeout(startTelegramBot, 5000);
    }
  });
}

// ── 4. Health Check & Keep-Alive Loop ───────────────────────────────────────
function checkHealth() {
  if (isShuttingDown) return;

  http
    .get(HEALTH_URL, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data);
            failedPings = 0;
            log(
              `Health check OK • Uptime: ${json.uptimeFormatted} • Memory: ${json.memoryUsage.heapUsedMb}MB • DB: ${json.database}`,
              'KEEP_ALIVE'
            );
          } catch (e) {
            log('Health check response parsing error', 'WARN');
          }
        } else {
          handleFailedPing(`HTTP ${res.statusCode}`);
        }
      });
    })
    .on('error', (err) => {
      handleFailedPing(err.message);
    });
}

function handleFailedPing(reason) {
  failedPings++;
  log(`Health check failed (${failedPings}/${MAX_FAILED_PINCS}): ${reason}`, 'WARN');

  if (failedPings >= MAX_FAILED_PINCS) {
    log('Max health check failures reached. Restarting Next.js server...', 'ERROR');
    failedPings = 0;
    if (nextProcess) {
      try { nextProcess.kill('SIGKILL'); } catch (e) {}
    } else {
      startNextServer();
    }
  }
}

// ── 5. Graceful Shutdown ────────────────────────────────────────────────────
function shutdown() {
  log('Shutting down 24/7 supervisor...', 'INFO');
  isShuttingDown = true;

  if (nextProcess) {
    try { nextProcess.kill(); } catch (e) {}
  }
  if (botProcess) {
    try { botProcess.kill(); } catch (e) {}
  }
  if (tunnelProcess) {
    try { tunnelProcess.kill(); } catch (e) {}
  }

  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// ── Main Initialization ─────────────────────────────────────────────────────
function main() {
  console.log('\n======================================================');
  console.log('  🧠 SECOND BRAIN AI - 24/7 INTEGRATED SERVER & BOT  ');
  console.log('======================================================\n');

  startNextServer();
  startTunnel();
  setTimeout(startTelegramBot, 2000);

  setInterval(checkHealth, PING_INTERVAL_MS);
  log(`Keep-alive monitor active (Pinging ${HEALTH_URL} every 15s)`, 'SUCCESS');
}

main();

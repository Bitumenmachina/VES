// VES G0 gate harness — zero-dependency CDP driver.
// Node 24 (global WebSocket, global fetch) + headless Chrome. Lives OUTSIDE the
// product file; product bytes carry no proof machinery. Usage:
//   node gate.mjs <path-to-VES.html> <scenario.js>
// Prints the scenario's returned JSON to stdout. Exit 2 on harness failure.
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = process.env.VES_CHROME || 'google-chrome';
const VES = process.argv[2] || join(process.cwd(), 'src/VES_PM.html');
const SCEN = process.argv[3] || join(import.meta.dirname, 'scenarioA.js');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function connect(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    let id = 0; const pending = new Map();
    ws.addEventListener('open', () => resolve({
      send(method, params = {}) {
        return new Promise((res, rej) => {
          const mid = ++id; pending.set(mid, { res, rej });
          ws.send(JSON.stringify({ id: mid, method, params }));
        });
      },
      close() { ws.close(); },
    }));
    ws.addEventListener('error', () => reject(new Error('websocket error')));
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && pending.has(msg.id)) {
        const { res, rej } = pending.get(msg.id); pending.delete(msg.id);
        if (msg.error) rej(new Error(JSON.stringify(msg.error))); else res(msg.result);
      }
    });
  });
}

async function main() {
  const port = 9222 + Math.floor(Math.random() * 500);
  const profile = mkdtempSync(join(tmpdir(), 'ves-gate-'));
  const chrome = spawn(CHROME, [
    '--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
    '--remote-allow-origins=*', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
    '--no-first-run', '--no-default-browser-check', 'file://' + VES,
  ], { stdio: 'ignore' });

  try {
    let wsUrl = null;
    for (let i = 0; i < 150; i++) {
      try {
        const list = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
        const page = list.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
        if (page) { wsUrl = page.webSocketDebuggerUrl; break; }
      } catch (_) { /* not up yet */ }
      await sleep(100);
    }
    if (!wsUrl) throw new Error('devtools page target never appeared');

    const client = await connect(wsUrl);
    await client.send('Runtime.enable');
    await client.send('Page.enable');

    let ready = false;
    for (let i = 0; i < 150; i++) {
      const { result } = await client.send('Runtime.evaluate', {
        expression: '(document.readyState==="complete" && !!window.VESApp)', returnByValue: true,
      });
      if (result && result.value) { ready = true; break; }
      await sleep(100);
    }
    if (!ready) throw new Error('window.VESApp never became ready');

    const driver = readFileSync(SCEN, 'utf8');
    const { result, exceptionDetails } = await client.send('Runtime.evaluate', {
      expression: driver, returnByValue: true, awaitPromise: true,
    });
    if (exceptionDetails) throw new Error('scenario threw: ' + JSON.stringify(exceptionDetails));
    client.close();
    process.stdout.write(JSON.stringify(result.value, null, 2) + '\n');
  } finally {
    chrome.kill('SIGKILL');
  }
}

main().catch((e) => { console.error('HARNESS FAIL:', e.message || e); process.exit(2); });

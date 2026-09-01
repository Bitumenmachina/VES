// VES G0 gate — golden money-path proof. Zero-dependency: Node 24 (global
// WebSocket + fetch) drives headless Chrome over raw CDP. Lives OUTSIDE the
// product file; product bytes carry no proof machinery.
//
//   node g0.mjs create <ves.html>          # freeze goldens from a ratified build
//   node g0.mjs check  <candidate.html>    # gate a candidate; exit 0 green / 1 red
//
// Contract (F5, 2026-07-05): "byte-identical pricing" == golden-identical output.
// A is the golden; C (save→reload) and D (schedule-injected) must equal A; B pins
// the sell-ladder + recapModel-as-truth (R3). All comparisons are money-only
// ({recap,lines}); provenance inputs ride along but are not compared for C/D.
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

const HERE = import.meta.dirname;
const GOLD = join(HERE, 'goldens');
const CHROME = process.env.VES_CHROME || 'google-chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const sha = (buf) => createHash('sha256').update(buf).digest('hex');

// Stable, key-sorted JSON so comparison is order-independent.
function stable(v) {
  if (Array.isArray(v)) return '[' + v.map(stable).join(',') + ']';
  if (v && typeof v === 'object') return '{' + Object.keys(v).sort().map((k) => JSON.stringify(k) + ':' + stable(v[k])).join(',') + '}';
  return JSON.stringify(v);
}
const money = (o) => stable({ recap: o.recap, lines: o.lines });

const SCENARIOS = ['scenarioA.js', 'scenarioB.js', 'scenarioC.js', 'scenarioD.js'];

function connect(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    let id = 0; const pending = new Map(); const listeners = [];
    ws.addEventListener('open', () => resolve({
      send(method, params = {}) {
        return new Promise((res, rej) => { const mid = ++id; pending.set(mid, { res, rej }); ws.send(JSON.stringify({ id: mid, method, params })); });
      },
      on(fn) { listeners.push(fn); },
      close() { ws.close(); },
    }));
    ws.addEventListener('error', () => reject(new Error('websocket error')));
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && pending.has(msg.id)) { const { res, rej } = pending.get(msg.id); pending.delete(msg.id); return msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result); }
      for (const fn of listeners) fn(msg);
    });
  });
}

async function launch(vesPath) {
  const port = 9222 + Math.floor(Math.random() * 500);
  const profile = mkdtempSync(join(tmpdir(), 'ves-gate-'));
  const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
    '--remote-allow-origins=*', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--no-first-run',
    '--no-default-browser-check', 'about:blank'], { stdio: 'ignore' });
  let wsUrl = null;
  for (let i = 0; i < 150 && !wsUrl; i++) {
    try { const list = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const p = list.find((t) => t.type === 'page' && t.webSocketDebuggerUrl); if (p) wsUrl = p.webSocketDebuggerUrl; } catch (_) {}
    if (!wsUrl) await sleep(100);
  }
  if (!wsUrl) { chrome.kill('SIGKILL'); throw new Error('devtools target never appeared'); }
  const client = await connect(wsUrl);
  await client.send('Page.enable'); await client.send('Runtime.enable');
  const url = 'file://' + vesPath;
  return {
    async run(scenarioFile) {
      await client.send('Page.navigate', { url });
      let ready = false;
      for (let i = 0; i < 200; i++) {
        try { const { result } = await client.send('Runtime.evaluate', { expression: '(document.readyState==="complete" && !!window.VESApp)', returnByValue: true }); if (result && result.value) { ready = true; break; } } catch (_) {}
        await sleep(100);
      }
      if (!ready) throw new Error(`${scenarioFile}: VESApp never ready`);
      const src = readFileSync(join(HERE, scenarioFile), 'utf8');
      const { result, exceptionDetails } = await client.send('Runtime.evaluate', { expression: src, returnByValue: true, awaitPromise: true });
      if (exceptionDetails) throw new Error(`${scenarioFile}: ${JSON.stringify(exceptionDetails)}`);
      if (result.value && result.value.error) throw new Error(`${scenarioFile} scenario error: ${result.value.error}`);
      return result.value;
    },
    close() { client.close(); chrome.kill('SIGKILL'); },
  };
}

async function runAll(vesPath) {
  const drv = await launch(vesPath);
  const out = {};
  try { for (const s of SCENARIOS) out[s] = await drv.run(s); } finally { drv.close(); }
  return out;
}

async function main() {
  const [mode, target] = [process.argv[2], process.argv[3]];
  if (!['create', 'check'].includes(mode) || !target) { console.error('usage: node g0.mjs create|check <ves.html>'); process.exit(2); }
  const vesPath = target.startsWith('/') ? target : join(process.cwd(), target);
  const results = await runAll(vesPath);
  const A = results['scenarioA.js'], B = results['scenarioB.js'], C = results['scenarioC.js'], D = results['scenarioD.js'];

  if (mode === 'create') {
    if (!existsSync(GOLD)) mkdirSync(GOLD, { recursive: true });
    // Self-consistency the goldens must satisfy at birth.
    const checks = [['C==A (save/reload inert)', money(C) === money(A)], ['D==A (schedule inert)', money(D) === money(A)]];
    const bad = checks.filter(([, ok]) => !ok);
    if (bad.length) { console.error('CREATE refused — self-consistency failed:'); bad.forEach(([n]) => console.error('  ✗ ' + n)); process.exit(1); }
    writeFileSync(join(GOLD, 'goldenA.json'), JSON.stringify(A, null, 2) + '\n');
    writeFileSync(join(GOLD, 'goldenB.json'), JSON.stringify(B, null, 2) + '\n');
    const fp = {
      ves: { path: vesPath, sha256: sha(readFileSync(vesPath)) },
      goldenA_money_sha256: sha(money(A)), goldenB_money_sha256: sha(money(B)),
      harness: Object.fromEntries(['g0.mjs', ...SCENARIOS].map((f) => [f, sha(readFileSync(join(HERE, f)))])),
    };
    writeFileSync(join(GOLD, 'fingerprints.json'), JSON.stringify(fp, null, 2) + '\n');
    console.log('GOLDENS FROZEN.');
    console.log('  A cost=' + A.recap.cost + ' sell=' + A.recap.sell + ' lines=' + A.recap.lineCount);
    console.log('  B cost=' + B.recap.cost + ' sell=' + B.recap.sell);
    console.log('  ✓ C==A  ✓ D==A');
    console.log(JSON.stringify(fp, null, 2));
    return;
  }

  // check
  const gA = JSON.parse(readFileSync(join(GOLD, 'goldenA.json'), 'utf8'));
  const gB = JSON.parse(readFileSync(join(GOLD, 'goldenB.json'), 'utf8'));
  const rows = [
    ['A == goldenA (assembly money path)', money(A) === money(gA)],
    ['B == goldenB (sell-ladder + R3)', money(B) === money(gB)],
    ['C == goldenA (save/reload inert)', money(C) === money(gA)],
    ['D == goldenA (schedule inert)', money(D) === money(gA)],
  ];
  let green = true;
  for (const [name, ok] of rows) { console.log((ok ? '  ✓ ' : '  ✗ ') + name); if (!ok) green = false; }
  console.log(green ? 'G0 GREEN' : 'G0 RED');
  process.exit(green ? 0 : 1);
}

main().catch((e) => { console.error('HARNESS FAIL:', e.message || e); process.exit(2); });

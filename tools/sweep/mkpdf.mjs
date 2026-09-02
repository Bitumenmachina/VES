// Synthetic 36x24in "plan" PDF: vector paths only, no fonts, no client data. Output: absolute path arg.
import { writeFileSync } from 'node:fs';
const W = 2592, H = 1728; let s = '';
s += '1 w 0.6 G\n'; for (let x = 72; x < W; x += 72) s += `${x} 0 m ${x} ${H} l S\n`; for (let y = 72; y < H; y += 72) s += `0 ${y} m ${W} ${y} l S\n`;
s += '3 w 0 G\n'; s += `200 200 m 1400 200 l 1400 900 l 900 900 l 900 1300 l 200 1300 l h S\n`; s += `1500 300 m 2300 300 l 2300 1400 l 1500 1400 l h S\n`;
s += '1.5 w 0.3 G\n'; let seed = 7; const r = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const N = +(process.argv[3] || 1500);   // segments: 1500 = light plan, 40000 = the dense 'no lockup' fixture
for (let i = 0; i < N; i++) { const x = 200 + r() * 2100, y = 200 + r() * 1300; s += `${x.toFixed(1)} ${y.toFixed(1)} m ${(x + r() * 120).toFixed(1)} ${(y + r() * 120).toFixed(1)} l S\n`; }
s += '0 0 1 RG 4 w 300 1500 m 1300 1500 l S\n'; // a 1000-unit "dimension line" for calibration
const objs = [];
objs.push('<< /Type /Catalog /Pages 2 0 R >>'); objs.push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
objs.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Contents 4 0 R /Resources << >> >>`); objs.push(`<< /Length ${Buffer.byteLength(s)} >>\nstream\n${s}endstream`);
let out = '%PDF-1.4\n'; const offs = [];
objs.forEach((o, i) => { offs.push(Buffer.byteLength(out)); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
const xref = Buffer.byteLength(out); out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offs.map((o) => String(o).padStart(10, '0') + ' 00000 n \n').join('') + `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
writeFileSync(process.argv[2], out); console.log('wrote', process.argv[2], Buffer.byteLength(out), 'bytes');

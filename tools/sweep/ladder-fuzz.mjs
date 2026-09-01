// Adversary check: does round(Σ per-line ladder) ever differ from round(ladder(Σ cost))?
// Also: does oh/100*100 round-trip (bidCollect → sellOf) change a cent vs recapModel's direct pct?
function sellLadder(cost, ohPct, mkPct, pfPct) {
  const oh = Math.max(0, +ohPct || 0) / 100, mk = Math.max(0, +mkPct || 0) / 100, pf = Math.max(0, +pfPct || 0) / 100;
  const ohAmt = cost * oh, base = cost + ohAmt, mkAmt = base * mk, s1 = base + mkAmt, pfAmt = s1 * pf;
  return { cost, oh, mk, pf, ohAmt, mkAmt, pfAmt, sell: s1 + pfAmt };
}
let seed = 12345; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
let trials = 0, diffSum = 0, diffPct = 0, ex = [];
for (let t = 0; t < 2000000; t++) {
  const n = 1 + Math.floor(rnd() * 40);
  const costs = []; for (let i = 0; i < n; i++) costs.push(Math.round(rnd() * 5000000) / 100);
  const oh = Math.floor(rnd() * 30), mk = Math.floor(rnd() * 30), pf = Math.floor(rnd() * 30);
  const total = costs.reduce((a, b) => a + b, 0);
  const recap = sellLadder(total, oh, mk, pf).sell;
  const ohf = Math.max(0, oh) / 100, mkf = Math.max(0, mk) / 100, pff = Math.max(0, pf) / 100;
  let exact = 0; for (const c of costs) exact += sellLadder(c, ohf * 100, mkf * 100, pff * 100).sell;
  const bidTotal = Math.round(exact * 100), recapC = Math.round(recap * 100);
  trials++;
  if (bidTotal !== recapC) { diffSum++; if (ex.length < 5) ex.push({ n, oh, mk, pf, total, recap, exact, bidTotal, recapC }); }
  const direct = sellLadder(total, oh, mk, pf).sell, rt = sellLadder(total, ohf * 100, mkf * 100, pff * 100).sell;
  if (Math.round(direct * 100) !== Math.round(rt * 100)) diffPct++;
}
console.log(JSON.stringify({ trials, bidVsRecapCentMismatch: diffSum, pctRoundTripCentMismatch: diffPct, examples: ex }, null, 1));

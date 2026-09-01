// Scenario B (page context). One manual priced line, fixed qty/unit$, nonzero
// ladder — pins sellLadder math + recapModel-as-truth (R3), independent of the
// assembly engine. cost = 100 × 10 = 1000; sell = ladder(1000,10,8,5) = 1247.40.
(function () {
  const App = window.VESApp;
  if (!App) return { error: 'VESApp missing' };
  try {
    App.newTakeoff();
    App.addManualLine({ desc: 'GATE-B ladder pin', type: 'count', unit: 'EA', kind: 'material', csi: '01 00 00', qty: 100, price: 10 });
    const proj = App.state.assemblyProject; proj.settings = proj.settings || {};
    proj.settings.overheadPct = 10; proj.settings.markupPct = 8; proj.settings.profitPct = 5;
    const recap = App.recapModel();
    const res = App.resolveAssembly();
    const lines = (res.lines || []).map((l) => ({
      desc: l.desc, csi: l.csi, kind: l.kind, ordered: l.ordered, unit: l.unit,
      unitCost: l.unitCost, extended: l.extended, included: l.included, matchStatus: l.matchStatus }));
    return {
      inputs: { manual: { qty: 100, unit: 'EA', price: 10 }, oh: 10, mu: 8, pr: 5 },
      recap: { material: recap.material, labor: recap.labor, equipment: recap.equipment, cost: recap.cost,
        oh: recap.oh, mk: recap.mk, pf: recap.pf, ohAmt: recap.ohAmt, mkAmt: recap.mkAmt, pfAmt: recap.pfAmt,
        sell: recap.sell, lineCount: recap.lineCount },
      lines };
  } catch (e) { return { error: String((e && e.stack) || e) }; }
})()

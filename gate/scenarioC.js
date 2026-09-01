// Scenario C (page context, async). Build Scenario A → serialize to JSON (the
// durable save) → clear → reload from that JSON → re-read the money path. Output
// must be golden-identical to A: save/reload never perturbs pricing.
(async function () {
  const App = window.VESApp;
  if (!App) return { error: 'VESApp missing' };
  try {
    App.newTakeoff();
    App.loadAssembly('ssmr');
    App.addManualQuantity('ssmr.field', 3150.8);
    const proj = App.state.assemblyProject; proj.settings = proj.settings || {};
    proj.settings.overheadPct = 10; proj.settings.markupPct = 8; proj.settings.profitPct = 5;
    const saved = JSON.stringify(App.snapshot());   // the durable save (export)
    App.newTakeoff();                                // clear the board
    App.loadFromData(JSON.parse(saved));             // reload from the saved JSON
    await new Promise((r) => setTimeout(r, 120));    // settle async applySnapshot
    const recap = App.recapModel();
    const res = App.resolveAssembly();
    const lines = (res.lines || []).map((l) => ({
      desc: l.desc, csi: l.csi, kind: l.kind, ordered: l.ordered, unit: l.unit,
      unitCost: l.unitCost, extended: l.extended, included: l.included, matchStatus: l.matchStatus }));
    return {
      inputs: { reloadedFrom: 'snapshot' },
      recap: { material: recap.material, labor: recap.labor, equipment: recap.equipment, cost: recap.cost,
        oh: recap.oh, mk: recap.mk, pf: recap.pf, ohAmt: recap.ohAmt, mkAmt: recap.mkAmt, pfAmt: recap.pfAmt,
        sell: recap.sell, lineCount: recap.lineCount },
      lines };
  } catch (e) { return { error: String((e && e.stack) || e) }; }
})()

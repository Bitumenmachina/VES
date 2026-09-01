// Scenario A (page context, runs inside VES.html via CDP Runtime.evaluate).
// Drives the app's OWN functions through window.VESApp — no parallel logic.
// New takeoff → load SSMR → typed-exact 3150.8 SF on the field → fixed ladder →
// serialize the full priced output. OH/MU/PR are DECLARED harness fixtures
// (recorded in inputs), not witnessed reality; the per-line cost IS witnessed.
(function () {
  const App = window.VESApp;
  if (!App) return { error: 'VESApp missing' };
  try {
    App.newTakeoff();
    App.loadAssembly('ssmr');
    App.addManualQuantity('ssmr.field', 3150.8);
    const proj = App.state.assemblyProject;
    proj.settings = proj.settings || {};
    proj.settings.overheadPct = 10;
    proj.settings.markupPct = 8;
    proj.settings.profitPct = 5;
    const recap = App.recapModel();
    const res = App.resolveAssembly();
    const lines = (res.lines || []).map((l) => ({
      desc: l.desc, csi: l.csi, kind: l.kind, ordered: l.ordered, unit: l.unit,
      unitCost: l.unitCost, extended: l.extended, included: l.included, matchStatus: l.matchStatus,
    }));
    return {
      inputs: { assembly: 'ssmr', driver: 'ssmr.field', qty: 3150.8, oh: 10, mu: 8, pr: 5 },
      recap: {
        material: recap.material, labor: recap.labor, equipment: recap.equipment, cost: recap.cost,
        oh: recap.oh, mk: recap.mk, pf: recap.pf,
        ohAmt: recap.ohAmt, mkAmt: recap.mkAmt, pfAmt: recap.pfAmt,
        sell: recap.sell, lineCount: recap.lineCount,
      },
      lines,
    };
  } catch (e) { return { error: String((e && e.stack) || e) }; }
})()

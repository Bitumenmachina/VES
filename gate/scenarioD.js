// Scenario D (page context). Build Scenario A, then inject F18 schedule fields
// ({start,days}) onto conditions inside the takeoff store. Output must be
// golden-identical to A: schedule data is pricing-inert by construction. Guards
// F18 forever — the day it is built, this fails red if pricing ever moves.
(function () {
  const App = window.VESApp;
  if (!App) return { error: 'VESApp missing' };
  try {
    App.newTakeoff();
    App.loadAssembly('ssmr');
    App.addManualQuantity('ssmr.field', 3150.8);
    const proj = App.state.assemblyProject; proj.settings = proj.settings || {};
    proj.settings.overheadPct = 10; proj.settings.markupPct = 8; proj.settings.profitPct = 5;
    // F18: per-condition optional sched inside the one store.
    App.state.conditions.forEach((c, i) => { if (i % 2 === 0) c.sched = { start: '2026-07-01', days: 5 + i }; });
    const recap = App.recapModel();
    const res = App.resolveAssembly();
    const lines = (res.lines || []).map((l) => ({
      desc: l.desc, csi: l.csi, kind: l.kind, ordered: l.ordered, unit: l.unit,
      unitCost: l.unitCost, extended: l.extended, included: l.included, matchStatus: l.matchStatus }));
    return {
      inputs: { scheduleInjected: true },
      recap: { material: recap.material, labor: recap.labor, equipment: recap.equipment, cost: recap.cost,
        oh: recap.oh, mk: recap.mk, pf: recap.pf, ohAmt: recap.ohAmt, mkAmt: recap.mkAmt, pfAmt: recap.pfAmt,
        sell: recap.sell, lineCount: recap.lineCount },
      lines };
  } catch (e) { return { error: String((e && e.stack) || e) }; }
})()

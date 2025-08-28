import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PiggyBank, Settings2, Plus, Trash2, Upload, Download, RotateCcw } from "lucide-react";

// ---------- helpers ----------
const fmt = (n: number | string | undefined, c?: string) =>
  (c || "$") + (isNaN(Number(n)) ? "0" : Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 }));

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

const load = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
};

const save = (key: string, value: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};

// ---------- main component ----------
export default function SavingsPlannerApp() {
  const [currency, setCurrency] = useState(load("sp_currency", "$"));
  const [income, setIncome] = useState(load("sp_income", 300));
  const [rule, setRule] = useState(load("sp_rule", "50-30-20"));

  // Pay yourself first / aggressive settings
  const [pyfPct, setPyfPct] = useState(load("sp_pyfPct", 20));
  const [aggPct, setAggPct] = useState(load("sp_aggPct", 30));

  // Goal-based settings
  const [gbSavingsPct, setGbSavingsPct] = useState(load("sp_gbSavingsPct", 20));
  const [goals, setGoals] = useState(
    load< { id: string; name: string; pct: number }[] >("sp_goals", [
      { id: crypto.randomUUID(), name: "Emergency Fund", pct: 50 },
      { id: crypto.randomUUID(), name: "Future Goals", pct: 33 },
      { id: crypto.randomUUID(), name: "Investment", pct: 17 },
    ])
  );

  // Zero-based categories
  const [zbCats, setZbCats] = useState(
    load<{ id: string; name: string; amount: number }[]>("sp_zbCats", [
      { id: crypto.randomUUID(), name: "Rent/Food/Transport", amount: 180 },
      { id: crypto.randomUUID(), name: "Fun/Entertainment", amount: 30 },
      { id: crypto.randomUUID(), name: "Emergency Fund", amount: 40 },
      { id: crypto.randomUUID(), name: "Education/Skills", amount: 30 },
      { id: crypto.randomUUID(), name: "Investment", amount: 20 },
    ])
  );

  // persist
  useEffect(() => save("sp_currency", currency), [currency]);
  useEffect(() => save("sp_income", income), [income]);
  useEffect(() => save("sp_rule", rule), [rule]);
  useEffect(() => save("sp_pyfPct", pyfPct), [pyfPct]);
  useEffect(() => save("sp_aggPct", aggPct), [aggPct]);
  useEffect(() => save("sp_gbSavingsPct", gbSavingsPct), [gbSavingsPct]);
  useEffect(() => save("sp_goals", goals), [goals]);
  useEffect(() => save("sp_zbCats", zbCats), [zbCats]);

  // derived allocations
  const plan = useMemo(() => {
    const inc = Number(income) || 0;

    if (rule === "50-30-20") {
      return [
        { label: "Needs (50%)", amount: inc * 0.5 },
        { label: "Wants (30%)", amount: inc * 0.3 },
        { label: "Savings (20%)", amount: inc * 0.2 },
      ];
    }

    if (rule === "pyf") {
      const s = clamp(Number(pyfPct), 1, 90) / 100;
      return [
        { label: `Savings (${Math.round(s * 100)}%)`, amount: inc * s },
        { label: "Spending", amount: inc * (1 - s) },
      ];
    }

    if (rule === "goal-based") {
      const s = clamp(Number(gbSavingsPct), 1, 90) / 100;
      const savings = inc * s;
  const totalPct = goals.reduce((a: number, g) => a + (Number(g.pct) || 0), 0) || 1;
  const norm = goals.map((g) => ({ ...g, share: (Number(g.pct) || 0) / totalPct }));
      return [
        { label: `Savings Total (${Math.round(s * 100)}%)`, amount: savings },
        ...norm.map((g) => ({ label: `• ${g.name}`, amount: savings * g.share })),
        { label: "Spending", amount: inc * (1 - s) },
      ];
    }

    if (rule === "aggressive") {
      const s = clamp(Number(aggPct), 10, 90) / 100;
      return [
        { label: `Savings (${Math.round(s * 100)}%)`, amount: inc * s },
        { label: "Spending", amount: inc * (1 - s) },
      ];
    }

    if (rule === "zero-based") {
      // In ZBB, allocations are exact categories. If total != income, show remainder.
  const total = zbCats.reduce((a: number, c) => a + (Number(c.amount) || 0), 0);
  const rows = [...zbCats.map((c) => ({ label: c.name, amount: Number(c.amount) || 0 }))];
      const diff = inc - total;
      if (Math.abs(diff) > 0.005) rows.push({ label: diff > 0 ? "Unassigned" : "Over Budget", amount: diff });
      return rows;
    }

    return [];
  }, [income, rule, pyfPct, aggPct, gbSavingsPct, goals, zbCats]);

  const totalPlanned = plan.reduce((a, r) => a + r.amount, 0);

  // export / import
  const exportJson = () => {
    const data = {
      currency,
      income,
      rule,
      pyfPct,
      aggPct,
      gbSavingsPct,
      goals,
      zbCats,
      generatedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `savings_plan_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = typeof reader.result === 'string' ? reader.result : '';
        const data = JSON.parse(text) as any;
        if (data.currency) setCurrency(data.currency);
        if (data.income) setIncome(data.income);
        if (data.rule) setRule(data.rule);
        if (data.pyfPct) setPyfPct(data.pyfPct);
        if (data.aggPct) setAggPct(data.aggPct);
        if (data.gbSavingsPct) setGbSavingsPct(data.gbSavingsPct);
        if (data.goals) setGoals(data.goals);
        if (data.zbCats) setZbCats(data.zbCats);
      } catch (e) {
        alert("Invalid file");
      }
    };
    reader.readAsText(file as Blob);
  };

  const resetAll = () => {
    if (!confirm("Reset all settings?")) return;
    setCurrency("$");
    setIncome(300);
    setRule("50-30-20");
    setPyfPct(20);
    setAggPct(30);
    setGbSavingsPct(20);
    setGoals([
      { id: crypto.randomUUID(), name: "Emergency Fund", pct: 50 },
      { id: crypto.randomUUID(), name: "Future Goals", pct: 33 },
      { id: crypto.randomUUID(), name: "Investment", pct: 17 },
    ]);
    setZbCats([
      { id: crypto.randomUUID(), name: "Rent/Food/Transport", amount: 180 },
      { id: crypto.randomUUID(), name: "Fun/Entertainment", amount: 30 },
      { id: crypto.randomUUID(), name: "Emergency Fund", amount: 40 },
      { id: crypto.randomUUID(), name: "Education/Skills", amount: 30 },
      { id: crypto.randomUUID(), name: "Investment", amount: 20 },
    ]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-800 p-6">
      <div className="max-w-5xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <PiggyBank className="w-8 h-8" />
            <h1 className="text-2xl md:text-3xl font-semibold">Savings Planner</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={exportJson} className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl shadow-sm border bg-white hover:bg-slate-50">
              <Download className="w-4 h-4"/> Export
            </button>
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl shadow-sm border bg-white hover:bg-slate-50 cursor-pointer">
              <Upload className="w-4 h-4"/> Import
              <input type="file" accept="application/json" className="hidden" onChange={(e)=> e.target.files?.[0] && importJson(e.target.files[0])}/>
            </label>
            <button onClick={resetAll} className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl shadow-sm border bg-white hover:bg-slate-50">
              <RotateCcw className="w-4 h-4"/> Reset
            </button>
          </div>
        </header>

        {/* Controls */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-2xl border bg-white shadow-sm">
            <div className="text-sm text-slate-500 mb-1">Currency</div>
            <input
              className="w-full px-3 py-2 rounded-xl border"
              value={currency}
              onChange={(e) => setCurrency(e.target.value || "$")}
              placeholder="$ or ៛"
            />
          </div>

          <div className="p-4 rounded-2xl border bg-white shadow-sm">
            <div className="text-sm text-slate-500 mb-1">Monthly Income</div>
            <input
              type="number"
              className="w-full px-3 py-2 rounded-xl border"
              value={income}
              min={0}
              onChange={(e) => setIncome(Number(e.target.value))}
            />
          </div>

          <div className="p-4 rounded-2xl border bg-white shadow-sm">
            <div className="text-sm text-slate-500 mb-1 flex items-center gap-2"><Settings2 className="w-4 h-4"/> Saving Rule</div>
            <div className="flex flex-wrap gap-2">
              {[
                { id: "50-30-20", label: "50/30/20" },
                { id: "pyf", label: "Pay Yourself First" },
                { id: "goal-based", label: "Goal-based" },
                { id: "aggressive", label: "Aggressive" },
                { id: "zero-based", label: "Zero-based" },
              ].map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRule(r.id)}
                  className={`px-3 py-2 rounded-2xl border shadow-sm ${rule===r.id?"bg-slate-900 text-white":"bg-white hover:bg-slate-50"}`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Rule-specific config */}
        <AnimatePresence mode="wait">
          {rule === "pyf" && (
            <motion.div key="pyf" initial={{opacity:0, y:8}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-8}} className="p-4 rounded-2xl border bg-white shadow-sm mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Pay Yourself First</div>
                  <div className="text-sm text-slate-500">Choose a savings rate. Money moves to savings first; you live on the rest.</div>
                </div>
                <div className="text-right">
                  <div className="text-sm">Savings Rate</div>
                  <div className="text-xl font-semibold">{pyfPct}%</div>
                </div>
              </div>
              <input type="range" min={5} max={60} step={1} value={pyfPct} onChange={(e)=>setPyfPct(Number(e.target.value))} className="w-full mt-4"/>
            </motion.div>
          )}

          {rule === "aggressive" && (
            <motion.div key="aggr" initial={{opacity:0, y:8}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-8}} className="p-4 rounded-2xl border bg-white shadow-sm mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Aggressive Saving</div>
                  <div className="text-sm text-slate-500">Push savings higher for a big goal. Keep it realistic.</div>
                </div>
                <div className="text-right">
                  <div className="text-sm">Savings Rate</div>
                  <div className="text-xl font-semibold">{aggPct}%</div>
                </div>
              </div>
              <input type="range" min={30} max={70} step={1} value={aggPct} onChange={(e)=>setAggPct(Number(e.target.value))} className="w-full mt-4"/>
            </motion.div>
          )}

          {rule === "goal-based" && (
            <motion.div key="gb" initial={{opacity:0, y:8}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-8}} className="p-4 rounded-2xl border bg-white shadow-sm mb-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Goal-based Saving</div>
                    <div className="text-sm text-slate-500">Set an overall savings rate, then split across named goals.</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">Savings Rate</div>
                    <div className="text-xl font-semibold">{gbSavingsPct}%</div>
                  </div>
                </div>
                <input type="range" min={10} max={60} step={1} value={gbSavingsPct} onChange={(e)=>setGbSavingsPct(Number(e.target.value))} className="w-full"/>

                <div className="mt-2">
                  <div className="text-sm text-slate-500 mb-2">Goals (must sum to ~100%)</div>
                  <div className="flex flex-col gap-2">
                    {goals.map((g: { id: string; name: string; pct: number })=> (
                      <div key={g.id} className="grid grid-cols-12 gap-2 items-center">
                        <input className="col-span-6 md:col-span-7 px-3 py-2 rounded-xl border" value={g.name} onChange={(e)=> setGoals(goals.map((x: any)=> x.id===g.id? {...x, name: e.target.value}: x))}/>
                        <div className="col-span-4 md:col-span-3 flex items-center gap-2">
                          <input type="number" className="w-full px-3 py-2 rounded-xl border" value={g.pct} min={0} max={100}
                                 onChange={(e)=> setGoals(goals.map((x: any)=> x.id===g.id? {...x, pct: Number(e.target.value)}: x))}/>
                          <span className="text-sm">%</span>
                        </div>
                        <button onClick={()=> setGoals(goals.filter((x: any)=> x.id!==g.id))} className="col-span-2 inline-flex justify-center px-3 py-2 rounded-xl border bg-white hover:bg-slate-50"><Trash2 className="w-4 h-4"/></button>
                      </div>
                    ))}
                    <button onClick={()=> setGoals([...goals, { id: crypto.randomUUID(), name: "New Goal", pct: 0 }])} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border bg-white hover:bg-slate-50 mt-1">
                      <Plus className="w-4 h-4"/> Add Goal
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {rule === "zero-based" && (
            <motion.div key="zb" initial={{opacity:0, y:8}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-8}} className="p-4 rounded-2xl border bg-white shadow-sm mb-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-medium">Zero-based Budget</div>
                  <div className="text-sm text-slate-500">Every unit of income is assigned. Income − Expenses = 0.</div>
                </div>
                <button onClick={()=> setZbCats([...zbCats, { id: crypto.randomUUID(), name: "New Category", amount: 0 }])} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border bg-white hover:bg-slate-50">
                  <Plus className="w-4 h-4"/> Add Category
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {zbCats.map((c: { id: string; name: string; amount: number })=> (
                  <div key={c.id} className="grid grid-cols-12 gap-2 items-center">
                    <input className="col-span-6 md:col-span-7 px-3 py-2 rounded-xl border" value={c.name} onChange={(e)=> setZbCats(zbCats.map((x: any)=> x.id===c.id? {...x, name: e.target.value}: x))}/>
                    <input type="number" className="col-span-4 md:col-span-3 px-3 py-2 rounded-xl border" value={c.amount} min={0}
                           onChange={(e)=> setZbCats(zbCats.map((x: any)=> x.id===c.id? {...x, amount: Number(e.target.value)}: x))}/>
                    <button onClick={()=> setZbCats(zbCats.filter((x: any)=> x.id!==c.id))} className="col-span-2 inline-flex justify-center px-3 py-2 rounded-xl border bg-white hover:bg-slate-50"><Trash2 className="w-4 h-4"/></button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Summary */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-2xl border bg-white shadow-sm">
            <div className="text-sm text-slate-500 mb-1">Total Planned</div>
            <div className="text-2xl font-semibold">{fmt(totalPlanned, currency)}</div>
            <div className="text-xs text-slate-500">Income: {fmt(income, currency)}</div>
          </div>
          <div className="p-4 rounded-2xl border bg-white shadow-sm">
            <div className="text-sm text-slate-500 mb-1">Remainder</div>
            <div className={`text-2xl font-semibold ${Math.abs(income-totalPlanned)<0.01?"text-emerald-600":"text-amber-600"}`}>{fmt(income - totalPlanned, currency)}</div>
            <div className="text-xs text-slate-500">Aim for 0 remainder</div>
          </div>
          <div className="p-4 rounded-2xl border bg-white shadow-sm">
            <div className="text-sm text-slate-500 mb-1">Autosave Tip</div>
            <div className="text-sm">Schedule an automatic transfer on payday equal to your chosen savings amount.</div>
          </div>
        </div>

        {/* Allocation list */}
        <div className="p-4 rounded-2xl border bg-white shadow-sm">
          <div className="font-medium mb-3">Your Monthly Plan</div>
          <div className="flex flex-col gap-2">
            {plan.map((row, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-40 text-sm text-slate-600">{row.label}</div>
                <div className="flex-1 bg-slate-100 rounded-xl h-3 overflow-hidden">
                  <div
                    className={`h-3 ${row.amount>=0?"bg-slate-900":"bg-amber-500"}`}
                    style={{ width: `${clamp((Math.abs(row.amount) / (income || 1)) * 100, 0, 100)}%` }}
                  />
                </div>
                <div className="w-32 text-right font-medium">{fmt(row.amount, currency)}</div>
              </div>
            ))}
          </div>
        </div>

        <footer className="mt-8 text-center text-xs text-slate-500">
          Built for you — tweak the numbers until it fits. Autosaves to your browser.
        </footer>
      </div>
    </div>
  );
}

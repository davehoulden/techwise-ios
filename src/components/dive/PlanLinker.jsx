import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Link2, X } from 'lucide-react';

export default function PlanLinker({ value, onChange }) {
  const [plans, setPlans] = useState([]);
  const [expanded, setExpanded] = useState(!!value);

  useEffect(() => {
    base44.entities.DivePlan.list('-created_date', 50).then(setPlans).catch(() => {});
  }, []);

  const selected = plans.find(p => p.id === value);

  if (!expanded && !value) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="w-full flex items-center gap-2 text-sm text-slate-400 hover:text-blue-400 transition-colors border border-dashed border-slate-700 hover:border-blue-500/50 rounded-lg px-3 py-2.5"
      >
        <Link2 className="w-4 h-4 flex-shrink-0" />
        <span>Link a Dive Plan <span className="text-slate-600">(optional)</span></span>
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-slate-300">Linked Dive Plan</Label>
        {value && (
          <button type="button" onClick={() => { onChange(null); setExpanded(false); }} className="text-slate-500 hover:text-red-400">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {plans.length === 0 ? (
        <p className="text-slate-500 text-sm">No saved plans yet. Use the Dive Planner tab to create one.</p>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {plans.map(plan => (
            <button
              key={plan.id}
              type="button"
              onClick={() => { onChange(plan.id); setExpanded(false); }}
              className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition-all ${
                value === plan.id
                  ? 'border-blue-500 bg-blue-900/30 text-white'
                  : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-500'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{plan.name}</span>
                <span className="text-xs text-slate-400">{plan.type}</span>
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {plan.depth}m · {plan.bottom_time}min · {plan.gas_mix}
                {plan.deco_time > 0 ? ` · Deco: ${plan.deco_time}min` : ' · No deco'}
              </div>
            </button>
          ))}
        </div>
      )}

      {!value && (
        <Button type="button" variant="ghost" size="sm" className="text-slate-500 px-0" onClick={() => setExpanded(false)}>
          Cancel
        </Button>
      )}

      {selected && (
        <div className="text-xs text-slate-500 px-1">
          Linked: <span className="text-slate-300">{selected.name}</span>
          {selected.deco_stops && <span> — Stops: {selected.deco_stops}</span>}
        </div>
      )}
    </div>
  );
}
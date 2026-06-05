import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Trash2, Pencil, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';

function PlanCard({ plan, onDelete, onRename }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(plan.name);

  const handleRename = () => {
    if (name.trim() && name !== plan.name) onRename(plan.id, name.trim());
    setEditing(false);
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: plan.type === 'CCR' ? '#2a1a7c' : '#0e3a6e', color: plan.type === 'CCR' ? '#a78bfa' : '#60a5fa' }}>
          {plan.type}
        </span>

        {editing ? (
          <div className="flex-1 flex gap-2">
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setEditing(false); }}
              autoFocus
              className="h-7 text-sm bg-slate-800 border-slate-700 text-white"
            />
            <button onClick={handleRename} className="text-green-400 hover:text-green-300"><Check className="w-4 h-4" /></button>
            <button onClick={() => { setName(plan.name); setEditing(false); }} className="text-slate-500 hover:text-slate-300"><X className="w-4 h-4" /></button>
          </div>
        ) : (
          <span className="flex-1 text-sm font-medium text-white truncate">{plan.name}</span>
        )}

        {!editing && (
          <div className="flex items-center gap-1">
            <button onClick={() => setEditing(true)} className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onDelete(plan.id)} className="p-1.5 text-slate-500 hover:text-red-400 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setExpanded(v => !v)} className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors">
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>

      {/* Summary line */}
      <div className="px-4 pb-3 flex gap-4 text-xs text-slate-400">
        <span>{plan.depth}m</span>
        <span>{plan.bottom_time} min</span>
        <span>{plan.gas_mix}</span>
        {plan.deco_time > 0 && <span className="text-orange-400">Deco {plan.deco_time} min</span>}
        {plan.algorithm && <span className="text-slate-500">{plan.algorithm.toUpperCase()}</span>}
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2 border-t border-slate-800 pt-3">
              {plan.mod != null && (
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">MOD</span>
                  <span className="text-white">{plan.mod} m</span>
                </div>
              )}
              {plan.end != null && (
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">END</span>
                  <span className="text-white">{plan.end} m</span>
                </div>
              )}
              {plan.setpoint != null && (
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Setpoint</span>
                  <span className="text-white">{plan.setpoint} bar</span>
                </div>
              )}
              {plan.deco_stops && (
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Deco Stops</span>
                  <span className="text-white text-right">{plan.deco_stops || '—'}</span>
                </div>
              )}
              {plan.notes && (
                <p className="text-xs text-slate-400 mt-1">{plan.notes}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SavedPlans() {
  const queryClient = useQueryClient();

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['divePlans'],
    queryFn: () => base44.entities.DivePlan.list('-created_date', 100),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.DivePlan.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['divePlans'] }),
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, name }) => base44.entities.DivePlan.update(id, { name }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['divePlans'] }),
  });

  if (isLoading) return <p className="text-slate-500 text-sm text-center py-10">Loading…</p>;

  if (plans.length === 0) return (
    <div className="text-center py-16 text-slate-500">
      <p className="text-sm">No saved plans yet.</p>
      <p className="text-xs mt-1">Use the OC or CCR tab to calculate and save a plan.</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {plans.map(plan => (
        <PlanCard
          key={plan.id}
          plan={plan}
          onDelete={(id) => deleteMutation.mutate(id)}
          onRename={(id, name) => renameMutation.mutate({ id, name })}
        />
      ))}
    </div>
  );
}
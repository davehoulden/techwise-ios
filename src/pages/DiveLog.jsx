import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Waves, List, BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DiveForm from '@/components/dive/DiveForm';
import DiveCard from '@/components/dive/DiveCard';
import DiveStats from '@/components/dive/DiveStats';
import DiveFilter from '@/components/dive/DiveFilter';
import AIAssistantPanel from '@/components/dive/AIAssistantPanel';
import PullToRefresh from '@/components/ui/PullToRefresh';

export default function DiveLog() {
  const [showForm, setShowForm] = useState(false);
  const [editingDive, setEditingDive] = useState(null);
  const [view, setView] = useState('log'); // 'log' | 'stats'
  const [filteredDives, setFilteredDives] = useState([]);
  const queryClient = useQueryClient();

  const { data: dives = [], isLoading, refetch } = useQuery({
    queryKey: ['dives'],
    queryFn: () => base44.entities.Dive.list('-date')
  });

  const { data: divePlans = [] } = useQuery({
    queryKey: ['divePlans'],
    queryFn: () => base44.entities.DivePlan.list('-created_date', 100)
  });

  const planMap = React.useMemo(() => {
    const map = {};
    divePlans.forEach(p => { map[p.id] = p; });
    return map;
  }, [divePlans]);

  // Initialize filtered dives
  React.useEffect(() => {
    setFilteredDives(dives);
  }, [dives]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Dive.create(data),
    onMutate: async (newDive) => {
      await queryClient.cancelQueries({ queryKey: ['dives'] });
      const previous = queryClient.getQueryData(['dives']);
      queryClient.setQueryData(['dives'], (old = []) => [
        { ...newDive, id: 'optimistic-' + Date.now() },
        ...old
      ]);
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(['dives'], ctx.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['dives'] });
      setShowForm(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Dive.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['dives'] });
      const previous = queryClient.getQueryData(['dives']);
      queryClient.setQueryData(['dives'], (old = []) =>
        old.map(d => d.id === id ? { ...d, ...data } : d)
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(['dives'], ctx.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['dives'] });
      setEditingDive(null);
      setShowForm(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Dive.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['dives'] });
      const previous = queryClient.getQueryData(['dives']);
      queryClient.setQueryData(['dives'], (old = []) => old.filter(d => d.id !== id));
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(['dives'], ctx.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['dives'] })
  });

  const handleSubmit = (data) => {
    if (editingDive) {
      updateMutation.mutate({ id: editingDive.id, data });
    } else {
      const diveNumber = dives.length > 0 ? Math.max(...dives.map(d => d.dive_number || 0)) + 1 : 1;
      createMutation.mutate({ ...data, dive_number: diveNumber });
    }
  };

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a', paddingTop: 'env(safe-area-inset-top)' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-lg" style={{ background: '#0a0a0acc', borderBottom: '1px solid #1e1e1e', paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="px-4 py-3 flex items-center justify-between gap-2">
          <h1 className="text-xl font-bold text-white">Dive Log</h1>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex rounded-lg overflow-hidden" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
              <button
                onClick={() => setView('log')}
                className={`px-3 py-1.5 text-xs flex items-center gap-1 transition-colors ${view === 'log' ? 'text-white' : 'text-slate-500'}`}
                style={view === 'log' ? { background: '#1a7cff' } : {}}
              >
                <List className="w-3.5 h-3.5" /> Log
              </button>
              <button
                onClick={() => setView('stats')}
                className={`px-3 py-1.5 text-xs flex items-center gap-1 transition-colors ${view === 'stats' ? 'text-white' : 'text-slate-500'}`}
                style={view === 'stats' ? { background: '#1a7cff' } : {}}
              >
                <BarChart2 className="w-3.5 h-3.5" /> Stats
              </button>
            </div>
            <Button
              onClick={() => { setEditingDive(null); setShowForm(true); }}
              size="sm"
              style={{ background: '#1a7cff', touchAction: 'manipulation' }}
              className="select-none"
            >
              <Plus className="w-4 h-4 mr-1" />
              Log Dive
            </Button>
          </div>
        </div>
      </div>

      <PullToRefresh onRefresh={refetch}>
        {view === 'stats' ? (
          <div className="px-5 py-4 pb-8 space-y-5">
            <AIAssistantPanel />
            <DiveStats dives={filteredDives} />
          </div>
        ) : (
          <>
            {/* Filters */}
            <DiveFilter 
              dives={dives} 
              divePlans={divePlans} 
              onFilterChange={setFilteredDives} 
            />

            {/* Dive List */}
            <div className="px-5 pt-4 pb-8">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-32 bg-slate-800/50 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : dives.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
                    <Waves className="w-8 h-8 text-slate-600" />
                  </div>
                  <p className="text-slate-400">No dives logged yet</p>
                  <p className="text-slate-500 text-sm mt-1">Tap "Log Dive" to record your first dive</p>
                </motion.div>
              ) : filteredDives.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
                    <Waves className="w-8 h-8 text-slate-600" />
                  </div>
                  <p className="text-slate-400">No dives match your filters</p>
                  <p className="text-slate-500 text-sm mt-1">Try adjusting your search or filters</p>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {filteredDives.map((dive, index) => (
                        <DiveCard
                          key={dive.id}
                          dive={dive}
                          index={index}
                          linkedPlan={dive.dive_plan_id ? planMap[dive.dive_plan_id] : null}
                          onEdit={() => { setEditingDive(dive); setShowForm(true); }}
                          onDelete={() => deleteMutation.mutate(dive.id)}
                        />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </>
        )}
      </PullToRefresh>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <DiveForm
            dive={editingDive}
            onSubmit={handleSubmit}
            onClose={() => { setShowForm(false); setEditingDive(null); }}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
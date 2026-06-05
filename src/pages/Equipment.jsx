import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Wrench, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion';
import EquipmentCard from '../components/equipment/EquipmentCard';
import EquipmentForm from '../components/equipment/EquipmentForm';
import { differenceInDays, parseISO } from 'date-fns';

const DEFAULT_EQUIPMENT = [
  { name: 'Primary Cylinder', category: 'Breathing', brand: '', model: '', service_interval_months: 12 },
  { name: 'Stage / Bailout Cylinder', category: 'Breathing', brand: '', model: '', service_interval_months: 12 },
  { name: 'Primary Regulator (1st + 2nd Stage)', category: 'Breathing', brand: '', model: '', service_interval_months: 12 },
  { name: 'Backup Regulator', category: 'Breathing', brand: '', model: '', service_interval_months: 12 },
  { name: 'BCD / Wing', category: 'Buoyancy', brand: '', model: '', service_interval_months: 24 },
  { name: 'Drysuit', category: 'Exposure', brand: '', model: '', service_interval_months: 12 },
  { name: 'Wetsuit', category: 'Exposure', brand: '', model: '' },
  { name: 'Dive Computer', category: 'Instrumentation', brand: '', model: '', service_interval_months: 24 },
  { name: 'Compass', category: 'Instrumentation', brand: '', model: '' },
  { name: 'Underwater Torch (Primary)', category: 'Safety', brand: '', model: '' },
  { name: 'SMB + Reel', category: 'Safety', brand: '', model: '' },
  { name: 'Dive Knife / Cutter', category: 'Safety', brand: '', model: '' },
];

const CATEGORY_ORDER = ['Breathing', 'Buoyancy', 'Exposure', 'Instrumentation', 'Safety', 'Other'];

function serviceUrgency(item) {
  if (!item.next_service_date) return 999;
  const days = differenceInDays(parseISO(item.next_service_date), new Date());
  return days;
}

export default function Equipment() {
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
      const existing = await base44.entities.Equipment.filter({ user_email: u.email });
      if (existing.length === 0) {
        const seeded = await base44.entities.Equipment.bulkCreate(
          DEFAULT_EQUIPMENT.map(e => ({ ...e, user_email: u.email }))
        );
        setItems(seeded);
      } else {
        setItems(existing);
      }
      setLoading(false);
    });
  }, []);

  const handleSave = async (data) => {
    if (editing) {
      const updated = await base44.entities.Equipment.update(editing.id, data);
      setItems(items.map(i => i.id === editing.id ? updated : i));
    } else {
      const created = await base44.entities.Equipment.create({ ...data, user_email: user.email });
      setItems([...items, created]);
    }
    setShowForm(false);
    setEditing(null);
  };

  const handleEdit = (item) => {
    setEditing(item);
    setShowForm(true);
  };

  const handleDelete = async (item) => {
    await base44.entities.Equipment.delete(item.id);
    setItems(items.filter(i => i.id !== item.id));
  };

  const overdueCount = items.filter(i => i.next_service_date && differenceInDays(parseISO(i.next_service_date), new Date()) < 0).length;
  const soonCount = items.filter(i => i.next_service_date && differenceInDays(parseISO(i.next_service_date), new Date()) >= 0 && differenceInDays(parseISO(i.next_service_date), new Date()) <= 30).length;

  const categories = ['All', ...CATEGORY_ORDER.filter(c => items.some(i => i.category === c))];

  const filtered = items
    .filter(i => filter === 'All' || i.category === filter)
    .sort((a, b) => {
      const ua = serviceUrgency(a), ub = serviceUrgency(b);
      return ua - ub;
    });

  const grouped = CATEGORY_ORDER.reduce((acc, cat) => {
    const catItems = filtered.filter(i => i.category === cat);
    if (catItems.length) acc[cat] = catItems;
    return acc;
  }, {});
  const otherItems = filtered.filter(i => i.category === 'Other');
  if (otherItems.length) grouped['Other'] = otherItems;

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-lg" style={{ background: '#0a0a0acc', borderBottom: '1px solid #1e1e1e' }}>
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wrench className="w-5 h-5" style={{ color: '#1a7cff' }} />
            <h1 className="text-xl font-bold text-white">Equipment</h1>
          </div>
          <Button onClick={() => { setEditing(null); setShowForm(true); }}
            className="hover:opacity-90 h-8 px-3 text-sm gap-1"
            style={{ background: '#1a7cff' }}>
            <Plus className="w-4 h-4" /> Add
          </Button>
        </div>
      </div>

      <div className="px-4 py-5 space-y-5 pb-32">
        {/* Service alerts banner */}
        {(overdueCount > 0 || soonCount > 0) && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-xl px-4 py-3 flex items-start gap-3"
            style={{ background: overdueCount > 0 ? '#3f1010' : '#2d2000', border: `1px solid ${overdueCount > 0 ? '#ef444455' : '#f59e0b55'}` }}>
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: overdueCount > 0 ? '#ef4444' : '#f59e0b' }} />
            <div>
              {overdueCount > 0 && <p className="text-red-400 text-sm font-medium">{overdueCount} item{overdueCount > 1 ? 's' : ''} overdue for service</p>}
              {soonCount > 0 && <p className="text-yellow-400 text-sm">{soonCount} item{soonCount > 1 ? 's' : ''} due within 30 days</p>}
            </div>
          </motion.div>
        )}

        {/* Category filter */}
        {categories.length > 2 && (
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {categories.map(cat => (
              <button key={cat}
                onClick={() => setFilter(cat)}
                className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full transition-all"
                style={{
                  background: filter === cat ? '#1a7cff' : '#1a1a1a',
                  color: filter === cat ? '#fff' : '#888',
                  border: `1px solid ${filter === cat ? '#1a7cff' : '#2a2a2a'}`
                }}>
                {cat}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="rounded-xl h-20 animate-pulse" style={{ background: '#1a1a1a' }} />
            ))}
          </div>
        ) : (
          <AnimatePresence>
            {filter === 'All' ? (
              Object.entries(grouped).map(([cat, catItems]) => (
                <div key={cat} className="space-y-2">
                  <h2 className="text-xs uppercase tracking-widest font-semibold px-1" style={{ color: '#555' }}>{cat}</h2>
                  {catItems.map(item => (
                    <EquipmentCard key={item.id} item={item} onEdit={handleEdit} onDelete={handleDelete} />
                  ))}
                </div>
              ))
            ) : (
              <div className="space-y-2">
                {filtered.map(item => (
                  <EquipmentCard key={item.id} item={item} onEdit={handleEdit} onDelete={handleDelete} />
                ))}
              </div>
            )}
          </AnimatePresence>
        )}

        {!loading && items.length === 0 && (
          <div className="text-center py-16 text-slate-600 text-sm">No equipment yet. Tap Add to get started.</div>
        )}
      </div>

      {showForm && (
        <EquipmentForm
          item={editing}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}
    </div>
  );
}
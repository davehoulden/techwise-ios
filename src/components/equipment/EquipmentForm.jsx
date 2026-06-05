import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import MobileSelect from '@/components/ui/MobileSelect';

const CATEGORY_OPTIONS = ['Breathing', 'Buoyancy', 'Exposure', 'Instrumentation', 'Safety', 'Other']
  .map(v => ({ value: v, label: v }));
import { Textarea } from '@/components/ui/textarea';



const EMPTY = {
  name: '', category: 'Breathing', brand: '', model: '',
  serial_number: '', purchase_date: '', last_service_date: '',
  next_service_date: '', service_interval_months: '', usage_hours: '', notes: ''
};

export default function EquipmentForm({ item, onSave, onClose }) {
  const [form, setForm] = useState(item ? { ...item } : { ...EMPTY });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.name.trim()) return;
    onSave({
      ...form,
      service_interval_months: form.service_interval_months ? Number(form.service_interval_months) : undefined,
      usage_hours: form.usage_hours ? Number(form.usage_hours) : undefined,
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center"
        style={{ background: 'rgba(0,0,0,0.7)' }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="w-full max-w-lg rounded-t-2xl overflow-hidden"
          style={{ background: '#141414', border: '1px solid #2a2a2a', maxHeight: '90vh', overflowY: 'auto' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 sticky top-0" style={{ background: '#141414', borderBottom: '1px solid #1e1e1e' }}>
            <h2 className="text-white font-semibold">{item ? 'Edit Equipment' : 'Add Equipment'}</h2>
            <button onClick={onClose} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
          </div>

          <div className="px-5 py-4 space-y-4">
            {/* Name & Category */}
            <div className="space-y-2">
              <Label className="text-slate-400 text-xs uppercase tracking-wide">Item Name *</Label>
              <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Primary Regulator" className="bg-slate-900 border-slate-700 text-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400 text-xs uppercase tracking-wide">Category</Label>
              <MobileSelect
                value={form.category}
                onValueChange={v => set('category', v)}
                options={CATEGORY_OPTIONS}
                placeholder="Category"
                triggerClassName="bg-slate-900 border-slate-700 text-white"
              />
            </div>

            {/* Brand & Model */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-slate-400 text-xs uppercase tracking-wide">Brand</Label>
                <Input value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="e.g. Apeks" className="bg-slate-900 border-slate-700 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400 text-xs uppercase tracking-wide">Model</Label>
                <Input value={form.model} onChange={e => set('model', e.target.value)} placeholder="e.g. XTX200" className="bg-slate-900 border-slate-700 text-white" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-400 text-xs uppercase tracking-wide">Serial Number</Label>
              <Input value={form.serial_number} onChange={e => set('serial_number', e.target.value)} placeholder="Optional" className="bg-slate-900 border-slate-700 text-white" />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-slate-400 text-xs uppercase tracking-wide">Purchase Date</Label>
                <Input type="date" value={form.purchase_date} onChange={e => set('purchase_date', e.target.value)} className="bg-slate-900 border-slate-700 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400 text-xs uppercase tracking-wide">Last Serviced</Label>
                <Input type="date" value={form.last_service_date} onChange={e => set('last_service_date', e.target.value)} className="bg-slate-900 border-slate-700 text-white" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-slate-400 text-xs uppercase tracking-wide">Next Service Due</Label>
                <Input type="date" value={form.next_service_date} onChange={e => set('next_service_date', e.target.value)} className="bg-slate-900 border-slate-700 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400 text-xs uppercase tracking-wide">Service Interval (months)</Label>
                <Input type="number" value={form.service_interval_months} onChange={e => set('service_interval_months', e.target.value)} placeholder="12" className="bg-slate-900 border-slate-700 text-white" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-400 text-xs uppercase tracking-wide">Usage Hours</Label>
              <Input type="number" value={form.usage_hours} onChange={e => set('usage_hours', e.target.value)} placeholder="0" className="bg-slate-900 border-slate-700 text-white" />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-400 text-xs uppercase tracking-wide">Notes</Label>
              <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any additional notes…" className="bg-slate-900 border-slate-700 text-white" rows={2} />
            </div>

            <div className="flex gap-3 pb-4 pt-2">
              <Button variant="outline" onClick={onClose} className="flex-1 border-slate-700 text-slate-300">Cancel</Button>
              <Button onClick={handleSave} className="flex-1 hover:opacity-90" style={{ background: '#1a7cff' }}>Save</Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
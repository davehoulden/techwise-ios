import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import MobileSelect from '@/components/ui/MobileSelect';

const LEVEL_OPTIONS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'].map(v => ({ value: v, label: v }));

export default function CourseForm({ course, onSave, onClose, isLoading }) {
  const [form, setForm] = useState({
    name: course?.name || '',
    description: course?.description || '',
    level: course?.level || 'Beginner',
    duration: course?.duration || '',
    prerequisites: course?.prerequisites || '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="absolute bottom-0 left-0 right-0 bg-slate-900 rounded-t-3xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-slate-900 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">{course ? 'Edit Course' : 'Add Course'}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 pb-10 space-y-4">
          <div className="space-y-2">
            <Label className="text-slate-300">Course Name</Label>
            <Input
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="e.g. Advanced Trimix Diving"
              className="bg-slate-800 border-slate-700 text-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Level</Label>
              <MobileSelect
                value={form.level}
                onValueChange={v => set('level', v)}
                options={LEVEL_OPTIONS}
                placeholder="Level"
                triggerClassName="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Duration</Label>
              <Input
                value={form.duration}
                onChange={e => set('duration', e.target.value)}
                placeholder="e.g. 2-3 days"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Description</Label>
            <Textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Brief description of the course..."
              className="bg-slate-800 border-slate-700 text-white min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Prerequisites</Label>
            <Input
              value={form.prerequisites}
              onChange={e => set('prerequisites', e.target.value)}
              placeholder="e.g. Open Water certification"
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          <Button type="submit" disabled={isLoading} className="w-full" style={{ background: '#1a7cff' }}>
            {isLoading ? 'Saving...' : course ? 'Update Course' : 'Add Course'}
          </Button>
        </form>
      </motion.div>
    </motion.div>
  );
}
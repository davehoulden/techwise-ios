import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function SkillForm({ skill, courseId, onSave, onClose, isLoading }) {
  const [form, setForm] = useState({
    name: skill?.name || '',
    description: skill?.description || '',
    video_url: skill?.video_url || '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, course_id: courseId });
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
        className="absolute bottom-0 left-0 right-0 bg-slate-900 rounded-t-3xl max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-slate-900 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">{skill ? 'Edit Skill' : 'Add Skill'}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 pb-10 space-y-4">
          <div className="space-y-2">
            <Label className="text-slate-300">Skill Name</Label>
            <Input
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="e.g. Buoyancy Control"
              className="bg-slate-800 border-slate-700 text-white"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Description</Label>
            <Textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Short explanation of the skill and what the student will learn..."
              className="bg-slate-800 border-slate-700 text-white min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Demo Video URL</Label>
            <Input
              value={form.video_url}
              onChange={e => set('video_url', e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="bg-slate-800 border-slate-700 text-white"
              type="url"
            />
            <p className="text-xs text-slate-500">Link to a YouTube or other video demonstration</p>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full" style={{ background: '#1a7cff' }}>
            {isLoading ? 'Saving...' : skill ? 'Update Skill' : 'Add Skill'}
          </Button>
        </form>
      </motion.div>
    </motion.div>
  );
}
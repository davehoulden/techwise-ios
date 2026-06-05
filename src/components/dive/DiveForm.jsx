import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import MobileSelect from '@/components/ui/MobileSelect';
import DivePhotoUploader from './DivePhotoUploader';
import PlanLinker from './PlanLinker';
import AITagSuggestions from './AITagSuggestions';

const GAS_MIX_OPTIONS = ['Air', 'Nitrox 32', 'Nitrox 36', 'Trimix 21/35', 'Trimix 18/45', 'Trimix 15/55', 'Helitrox']
  .map(v => ({ value: v, label: v }));

export default function DiveForm({ dive, onSubmit, onClose, isLoading }) {
  const [formId] = useState(() => 'dive-form-' + Math.random().toString(36).slice(2));
  const [formData, setFormData] = useState({
    date: dive?.date || new Date().toISOString().split('T')[0],
    location: dive?.location || '',
    max_depth: dive?.max_depth || '',
    bottom_time: dive?.bottom_time || '',
    water_temp: dive?.water_temp || '',
    visibility: dive?.visibility || '',
    gas_mix: dive?.gas_mix || 'Air',
    deco_stops: dive?.deco_stops || '',
    buddy: dive?.buddy || '',
    notes: dive?.notes || '',
    rating: dive?.rating || 0,
    photos: dive?.photos || [],
    dive_plan_id: dive?.dive_plan_id || null,
    tags: dive?.tags || []
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      max_depth: parseFloat(formData.max_depth),
      bottom_time: parseFloat(formData.bottom_time),
      water_temp: formData.water_temp ? parseFloat(formData.water_temp) : null,
      visibility: formData.visibility ? parseFloat(formData.visibility) : null
    });
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
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-slate-900 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400">
            <X className="w-5 h-5" />
          </Button>
          <h2 className="text-lg font-semibold text-white">
            {dive ? 'Edit Dive' : 'Log New Dive'}
          </h2>
          <Button
            type="submit"
            form={formId}
            disabled={isLoading || (!formData.location && !formData.max_depth && !formData.bottom_time)}
            className="text-sm px-4 hover:opacity-90"
            style={{ background: '#1a7cff' }}
          >
            {isLoading ? 'Saving...' : dive ? 'Update' : 'Save'}
          </Button>
        </div>

        <form id={formId} onSubmit={handleSubmit} className="p-5 pb-10 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Date</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Gas Mix</Label>
              <MobileSelect
                value={formData.gas_mix}
                onValueChange={(v) => setFormData({ ...formData, gas_mix: v })}
                options={GAS_MIX_OPTIONS}
                placeholder="Gas Mix"
                triggerClassName="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Location</Label>
            <Input
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Dive site name"
              className="bg-slate-800 border-slate-700 text-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Max Depth (m)</Label>
              <Input
                type="number"
                value={formData.max_depth}
                onChange={(e) => setFormData({ ...formData, max_depth: e.target.value })}
                placeholder="40"
                className="bg-slate-800 border-slate-700 text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Bottom Time (min)</Label>
              <Input
                type="number"
                value={formData.bottom_time}
                onChange={(e) => setFormData({ ...formData, bottom_time: e.target.value })}
                placeholder="25"
                className="bg-slate-800 border-slate-700 text-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Water Temp (°C)</Label>
              <Input
                type="number"
                value={formData.water_temp}
                onChange={(e) => setFormData({ ...formData, water_temp: e.target.value })}
                placeholder="22"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Visibility (m)</Label>
              <Input
                type="number"
                value={formData.visibility}
                onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                placeholder="15"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Deco Stops</Label>
            <Input
              value={formData.deco_stops}
              onChange={(e) => setFormData({ ...formData, deco_stops: e.target.value })}
              placeholder="e.g., 6m/3min, 3m/5min"
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Buddy</Label>
            <Input
              value={formData.buddy}
              onChange={(e) => setFormData({ ...formData, buddy: e.target.value })}
              placeholder="Dive buddy name"
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Rating</Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormData({ ...formData, rating: star })}
                  className="p-1"
                >
                  <Star
                    className={`w-6 h-6 transition-colors ${
                      star <= formData.rating
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-slate-600 hover:text-slate-400'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes about the dive..."
              className="bg-slate-800 border-slate-700 text-white min-h-[100px]"
            />
          </div>

          <AITagSuggestions
            description={formData.notes}
            location={formData.location}
            gasMix={formData.gas_mix}
            onTagsSelect={(tags) => setFormData({ ...formData, tags })}
          />

          <div className="space-y-2">
            <Label className="text-slate-300">Photos</Label>
            <DivePhotoUploader
              photos={formData.photos}
              onChange={(photos) => setFormData({ ...formData, photos })}
            />
          </div>

          <PlanLinker
            value={formData.dive_plan_id}
            onChange={(id) => setFormData({ ...formData, dive_plan_id: id })}
          />


        </form>
      </motion.div>
    </motion.div>
  );
}
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Check } from 'lucide-react';

export default function SavePlanButton({ planData }) {
  const [showInput, setShowInput] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await base44.entities.DivePlan.create({ ...planData, name: name.trim() });
    setSaving(false);
    setSaved(true);
    setShowInput(false);
    setName('');
    setTimeout(() => setSaved(false), 3000);
  };

  if (saved) {
    return (
      <div className="flex items-center gap-2 text-green-400 text-sm py-2">
        <Check className="w-4 h-4" />
        Plan saved!
      </div>
    );
  }

  if (showInput) {
    return (
      <div className="flex gap-2 items-end">
        <div className="flex-1 space-y-1">
          <Label className="text-slate-300 text-xs">Plan name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. 40m trimix plan"
            className="bg-slate-900/50 border-slate-600 text-white"
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            autoFocus
          />
        </div>
        <Button
          onClick={handleSave}
          disabled={saving || !name.trim()}
          size="sm"
          style={{ background: '#1a7cff' }}
        >
          {saving ? 'Saving...' : 'Save'}
        </Button>
        <Button
          onClick={() => setShowInput(false)}
          size="sm"
          variant="ghost"
          className="text-slate-400"
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={() => setShowInput(true)}
      variant="outline"
      className="w-full border-slate-600 text-slate-300 hover:text-white hover:border-slate-400"
    >
      <Save className="w-4 h-4 mr-2" />
      Save This Plan
    </Button>
  );
}
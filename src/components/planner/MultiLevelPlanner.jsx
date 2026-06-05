import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Plus, Trash2, Save } from 'lucide-react';
import MobileSelect from '@/components/ui/MobileSelect';

const GAS_MIX_OPTIONS = ['Air', 'Nitrox 32', 'Nitrox 36', 'Trimix 21/35', 'Trimix 18/45', 'Trimix 15/55', 'Helitrox']
  .map(v => ({ value: v, label: v }));

export default function MultiLevelPlanner() {
  const [planName, setPlanName] = useState('');
  const [segments, setSegments] = useState([
    { depth: 40, time: 10, gas_mix: 'Air' }
  ]);
  const [ndlStatus, setNdlStatus] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Calculate NDL for each segment and cumulative values
  const calculateNDL = () => {
    const ndlTable = {
      Air: { 40: 47, 50: 27, 60: 17, 70: 12 },
      'Nitrox 32': { 40: 127, 50: 55, 60: 34, 70: 23 },
      'Nitrox 36': { 40: 180, 50: 80, 60: 50, 70: 34 },
    };

    let cumulativeTime = 0;
    const updatedSegments = segments.map((seg, idx) => {
      const baseNdl = ndlTable[seg.gas_mix]?.[Math.floor(seg.depth / 10) * 10] || 60;
      const ndl = Math.max(0, baseNdl - cumulativeTime);
      cumulativeTime += seg.time;
      return { ...seg, ndl, decoRequired: ndl <= 0 };
    });

    const totalDecoTime = updatedSegments.reduce((acc, seg) => {
      if (seg.decoRequired && seg.depth < 10) acc += Math.ceil(cumulativeTime / 3);
      return acc;
    }, 0);

    setNdlStatus({
      segments: updatedSegments,
      totalTime: cumulativeTime,
      totalDecoTime,
      decoRequired: updatedSegments.some(s => s.decoRequired)
    });
  };

  const addSegment = () => {
    setSegments([...segments, { depth: 30, time: 10, gas_mix: 'Air' }]);
  };

  const removeSegment = (idx) => {
    if (segments.length > 1) {
      setSegments(segments.filter((_, i) => i !== idx));
    }
  };

  const updateSegment = (idx, field, value) => {
    const updated = [...segments];
    updated[idx][field] = field === 'depth' || field === 'time' ? parseFloat(value) : value;
    setSegments(updated);
  };

  const handleSavePlan = async () => {
    if (!planName.trim()) {
      alert('Please enter a plan name');
      return;
    }

    setIsSaving(true);
    try {
      await base44.entities.DivePlan.create({
        name: planName,
        type: 'OC',
        depth: Math.max(...segments.map(s => s.depth)),
        bottom_time: segments.reduce((sum, s) => sum + s.time, 0),
        gas_mix: segments.map(s => s.gas_mix).join(' / '),
        algorithm: 'Multi-Level Profile',
        deco_time: ndlStatus?.totalDecoTime || 0,
        deco_stops: `Multi-level segments: ${segments.length}`,
        notes: `Segments: ${segments.map(s => `${s.depth}m/${s.time}min (${s.gas_mix})`).join(', ')}`
      });
      alert('Plan saved successfully!');
      setPlanName('');
      setSegments([{ depth: 40, time: 10, gas_mix: 'Air' }]);
      setNdlStatus(null);
    } catch (error) {
      alert('Error saving plan: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5 pb-10">
      <div className="space-y-2">
        <Label className="text-slate-300">Plan Name</Label>
        <Input
          value={planName}
          onChange={(e) => setPlanName(e.target.value)}
          placeholder="e.g., Caribbean Blue Hole"
          className="bg-slate-800 border-slate-700 text-white"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-slate-300">Depth Segments</Label>
          <Button
            onClick={addSegment}
            size="sm"
            className="gap-1"
            style={{ background: '#1a7cff' }}
          >
            <Plus className="w-4 h-4" />
            Add Segment
          </Button>
        </div>

        <div className="space-y-3">
          {segments.map((seg, idx) => (
            <Card key={idx} className="p-4" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs text-slate-400">Depth (m)</Label>
                  <Input
                    type="number"
                    value={seg.depth}
                    onChange={(e) => updateSegment(idx, 'depth', e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-slate-400">Time (min)</Label>
                  <Input
                    type="number"
                    value={seg.time}
                    onChange={(e) => updateSegment(idx, 'time', e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-slate-400">Gas Mix</Label>
                  <MobileSelect
                    value={seg.gas_mix}
                    onValueChange={(v) => updateSegment(idx, 'gas_mix', v)}
                    options={GAS_MIX_OPTIONS}
                    triggerClassName="bg-slate-800 border-slate-700 text-white text-sm"
                  />
                </div>
              </div>
              {segments.length > 1 && (
                <Button
                  onClick={() => removeSegment(idx)}
                  variant="ghost"
                  size="sm"
                  className="mt-3 text-red-400 hover:text-red-300 w-full gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove
                </Button>
              )}
            </Card>
          ))}
        </div>
      </div>

      <Button
        onClick={calculateNDL}
        className="w-full"
        style={{ background: '#1a7cff' }}
      >
        Calculate NDL & Deco
      </Button>

      {ndlStatus && (
        <Card className="p-4 space-y-3" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
          <h3 className="text-sm font-semibold text-white">Profile Summary</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Total Bottom Time:</span>
              <span className="text-white font-medium">{ndlStatus.totalTime} min</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Deco Time:</span>
              <span className={`font-medium ${ndlStatus.totalDecoTime > 0 ? 'text-amber-400' : 'text-green-400'}`}>
                {ndlStatus.totalDecoTime} min
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-400">Segment NDL Status</h4>
            {ndlStatus.segments.map((seg, idx) => (
              <div key={idx} className="flex justify-between text-xs p-2 rounded" style={{ background: '#0a0a0a' }}>
                <span className="text-slate-300">Seg {idx + 1}: {seg.depth}m / {seg.time}min</span>
                <span className={seg.decoRequired ? 'text-red-400 font-semibold' : 'text-green-400'}>
                  NDL: {seg.ndl}min
                </span>
              </div>
            ))}
          </div>

          {ndlStatus.decoRequired && (
            <div className="p-2 rounded text-xs" style={{ background: '#4a2a2a', color: '#ff9999' }}>
              ⚠️ Decompression required for this profile
            </div>
          )}
        </Card>
      )}

      <Button
        onClick={handleSavePlan}
        disabled={isSaving || !planName.trim()}
        className="w-full gap-2"
        style={{ background: '#1a7cff' }}
      >
        <Save className="w-4 h-4" />
        Save Multi-Level Plan
      </Button>
    </div>
  );
}
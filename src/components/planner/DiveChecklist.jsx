import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, CheckSquare, Square, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const DEFAULT_OC = [
  'BCD – inspect and inflate/deflate test',
  'Regulator – breathe from all stages',
  'Cylinder pressure checked (min 200 bar)',
  'Dive computer – charged and set',
  'Mask, fins and wetsuit packed',
  'Weight belt / integrated weights fitted',
  'Surface marker buoy (SMB) + reel',
  'Dive knife / cutting tool',
  'Underwater torch',
  'Buddy check completed (BWRAF)',
  'Dive brief received / plan confirmed',
  'Emergency O2 kit on surface',
];

const DEFAULT_CCR = [
  'Unit assembly and scrubber pack verified',
  'Scrubber duration within limits (log time)',
  'Pre-dive checklist (MODS or unit-specific)',
  'Oxygen cells – check agreement / calibrate',
  'Diluent cylinder pressure checked',
  'O2 cylinder pressure checked',
  'Bailout cylinder(s) – pressure & gas verified',
  'Handsets / HUD – powered on, reading correctly',
  'Mouthpiece DSV / BOV – no leaks',
  'Counter-lung breathing loop – no restrictions',
  'Setpoint confirmed for planned depth',
  'Dive computer(s) set and synced',
  'Drysuit / wetsuit inspected',
  'SMB + reel + lift bag ready',
  'Underwater slate / wet notes',
  'Buddy CCR checks completed',
  'Dive brief and emergency procedures confirmed',
  'Surface O2 kit and first aid on boat',
];

export default function DiveChecklist() {
  const [user, setUser] = useState(null);
  const [ocItems, setOcItems] = useState([]);
  const [ccrItems, setCcrItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newOcText, setNewOcText] = useState('');
  const [newCcrText, setNewCcrText] = useState('');

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
      const all = await base44.entities.ChecklistItem.filter({ user_email: u.email });
      const oc = all.filter(i => i.list_type === 'oc_recreational').sort((a, b) => a.order - b.order);
      const ccr = all.filter(i => i.list_type === 'ccr_technical').sort((a, b) => a.order - b.order);

      if (oc.length === 0) {
        // Seed defaults
        const seeded = await base44.entities.ChecklistItem.bulkCreate(
          DEFAULT_OC.map((text, idx) => ({ user_email: u.email, list_type: 'oc_recreational', text, order: idx, checked: false }))
        );
        setOcItems(seeded);
      } else {
        setOcItems(oc);
      }

      if (ccr.length === 0) {
        const seeded = await base44.entities.ChecklistItem.bulkCreate(
          DEFAULT_CCR.map((text, idx) => ({ user_email: u.email, list_type: 'ccr_technical', text, order: idx, checked: false }))
        );
        setCcrItems(seeded);
      } else {
        setCcrItems(ccr);
      }

      setLoading(false);
    });
  }, []);

  const toggle = async (item, items, setItems) => {
    const updated = await base44.entities.ChecklistItem.update(item.id, { checked: !item.checked });
    setItems(items.map(i => i.id === item.id ? updated : i));
  };

  const addItem = async (listType, text, items, setItems, setText) => {
    if (!text.trim()) return;
    const created = await base44.entities.ChecklistItem.create({
      user_email: user.email,
      list_type: listType,
      text: text.trim(),
      order: items.length,
      checked: false,
    });
    setItems([...items, created]);
    setText('');
  };

  const removeItem = async (item, items, setItems) => {
    await base44.entities.ChecklistItem.delete(item.id);
    setItems(items.filter(i => i.id !== item.id));
  };

  const resetAll = async (listType, defaults, setItems) => {
    const existing = listType === 'oc_recreational' ? ocItems : ccrItems;
    await Promise.all(existing.map(i => base44.entities.ChecklistItem.delete(i.id)));
    const seeded = await base44.entities.ChecklistItem.bulkCreate(
      defaults.map((text, idx) => ({ user_email: user.email, list_type: listType, text, order: idx, checked: false }))
    );
    setItems(seeded);
  };

  const uncheckAll = async (items, setItems) => {
    const updated = await Promise.all(
      items.filter(i => i.checked).map(i => base44.entities.ChecklistItem.update(i.id, { checked: false }))
    );
    setItems(items.map(i => {
      const u = updated.find(u => u.id === i.id);
      return u ? u : i;
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-500 text-sm">
        Loading checklist…
      </div>
    );
  }

  return (
    <Tabs defaultValue="oc" className="space-y-4">
      <TabsList className="w-full" style={{ background: '#141414', border: '1px solid #222' }}>
        <TabsTrigger value="oc" className="flex-1 data-[state=active]:text-white text-xs">
          OC Recreational
        </TabsTrigger>
        <TabsTrigger value="ccr" className="flex-1 data-[state=active]:text-white text-xs">
          CCR Technical
        </TabsTrigger>
      </TabsList>

      <TabsContent value="oc">
        <ChecklistPanel
          items={ocItems}
          setItems={setOcItems}
          newText={newOcText}
          setNewText={setNewOcText}
          listType="oc_recreational"
          defaults={DEFAULT_OC}
          onToggle={(item) => toggle(item, ocItems, setOcItems)}
          onAdd={() => addItem('oc_recreational', newOcText, ocItems, setOcItems, setNewOcText)}
          onRemove={(item) => removeItem(item, ocItems, setOcItems)}
          onReset={() => resetAll('oc_recreational', DEFAULT_OC, setOcItems)}
          onUncheckAll={() => uncheckAll(ocItems, setOcItems)}
        />
      </TabsContent>

      <TabsContent value="ccr">
        <ChecklistPanel
          items={ccrItems}
          setItems={setCcrItems}
          newText={newCcrText}
          setNewText={setNewCcrText}
          listType="ccr_technical"
          defaults={DEFAULT_CCR}
          onToggle={(item) => toggle(item, ccrItems, setCcrItems)}
          onAdd={() => addItem('ccr_technical', newCcrText, ccrItems, setCcrItems, setNewCcrText)}
          onRemove={(item) => removeItem(item, ccrItems, setCcrItems)}
          onReset={() => resetAll('ccr_technical', DEFAULT_CCR, setCcrItems)}
          onUncheckAll={() => uncheckAll(ccrItems, setCcrItems)}
        />
      </TabsContent>
    </Tabs>
  );
}

function ChecklistPanel({ items, newText, setNewText, onToggle, onAdd, onRemove, onReset, onUncheckAll }) {
  const checked = items.filter(i => i.checked).length;

  return (
    <div className="space-y-3">
      {/* Progress */}
      <div className="rounded-xl px-4 py-3 flex items-center justify-between"
        style={{ background: '#141414', border: '1px solid #2a2a2a' }}>
        <span className="text-slate-400 text-sm">{checked} / {items.length} completed</span>
        <div className="flex gap-2">
          {checked > 0 && (
            <Button variant="ghost" size="sm" onClick={onUncheckAll}
              className="text-slate-500 hover:text-white h-7 px-2 text-xs gap-1">
              <RotateCcw className="w-3 h-3" /> Reset checks
            </Button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="rounded-full h-1.5 overflow-hidden" style={{ background: '#2a2a2a' }}>
        <div className="h-full rounded-full transition-all duration-300"
          style={{ width: `${items.length ? (checked / items.length) * 100 : 0}%`, background: '#1a7cff' }} />
      </div>

      {/* Items */}
      <div className="rounded-xl overflow-hidden divide-y" style={{ border: '1px solid #2a2a2a', borderColor: '#2a2a2a', divideColor: '#1e1e1e' }}>
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 px-4 py-3"
            style={{ background: item.checked ? '#0f1a0f' : '#141414' }}>
            <button onClick={() => onToggle(item)} className="flex-shrink-0">
              {item.checked
                ? <CheckSquare className="w-5 h-5" style={{ color: '#22c55e' }} />
                : <Square className="w-5 h-5 text-slate-600" />}
            </button>
            <span className={`flex-1 text-sm ${item.checked ? 'line-through text-slate-600' : 'text-slate-200'}`}>
              {item.text}
            </span>
            <button onClick={() => onRemove(item)} className="flex-shrink-0 p-1 text-slate-700 hover:text-red-400 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Add item */}
      <div className="flex gap-2">
        <Input
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onAdd()}
          placeholder="Add custom item…"
          className="bg-slate-900 border-slate-700 text-white text-sm"
        />
        <Button onClick={onAdd} className="flex-shrink-0 hover:opacity-90"
          style={{ background: '#1a7cff' }}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Reset to defaults */}
      <button onClick={onReset}
        className="w-full text-xs text-slate-600 hover:text-slate-400 transition-colors py-1">
        Reset to default checklist
      </button>
    </div>
  );
}
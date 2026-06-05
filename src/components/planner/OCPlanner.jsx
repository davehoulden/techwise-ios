import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { calculateDecoStops, ALGORITHM_LABELS } from './decoAlgorithms';
import SavePlanButton from './SavePlanButton';
import MobileSelect from '@/components/ui/MobileSelect';

const gasMixes = {
  'Air': { o2: 21, he: 0 },
  'Nitrox 32': { o2: 32, he: 0 },
  'Nitrox 36': { o2: 36, he: 0 },
  'Trimix 21/35': { o2: 21, he: 35 },
  'Trimix 18/45': { o2: 18, he: 45 },
  'Trimix 15/55': { o2: 15, he: 55 }
};

export default function OCPlanner() {
  const [depth, setDepth] = useState('');
  const [bottomTime, setBottomTime] = useState('');
  const [gasMix, setGasMix] = useState('Air');
  const [algorithm, setAlgorithm] = useState('simple');
  const [result, setResult] = useState(null);

  const calculate = () => {
    const d = parseFloat(depth);
    const bt = parseFloat(bottomTime);
    const mix = gasMixes[gasMix];
    if (!d || !bt) return;

    const ppO2Max = 1.4;
    const mod = Math.floor(((ppO2Max / (mix.o2 / 100)) - 1) * 10);
    const ata = (d / 10) + 1;
    const ppO2 = (mix.o2 / 100) * ata;
    const narcoticFraction = (100 - mix.he) / 100;
    const end = Math.floor(((ata * narcoticFraction) - 1) * 10);

    const decoStops = calculateDecoStops(algorithm, d, bt, mix.o2 / 100, mix.he / 100);
    const decoTime = decoStops.reduce((sum, s) => sum + s.time, 0);

    setResult({ mod, ppO2: ppO2.toFixed(2), end, decoTime, decoStops, isOverMod: d > mod, isPpO2High: ppO2 > 1.4 });
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Calculator className="w-5 h-5" style={{ color: '#1a7cff' }} />
              OC Dive Parameters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Depth (m)</Label>
                <Input type="number" value={depth} onChange={(e) => setDepth(e.target.value)} placeholder="40" className="bg-slate-900/50 border-slate-600 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Bottom Time (min)</Label>
                <Input type="number" value={bottomTime} onChange={(e) => setBottomTime(e.target.value)} placeholder="25" className="bg-slate-900/50 border-slate-600 text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Gas Mix</Label>
              <MobileSelect
                value={gasMix}
                onValueChange={setGasMix}
                options={Object.keys(gasMixes).map(m => ({ value: m, label: m }))}
                placeholder="Gas Mix"
                triggerClassName="bg-slate-900/50 border-slate-600 text-white"
              />
            </div>
            {/* Partial Pressure Table */}
            {(() => {
              const mix = gasMixes[gasMix];
              const fO2 = mix.o2 / 100;
              const fHe = mix.he / 100;
              const fN2 = (100 - mix.o2 - mix.he) / 100;
              const hasHe = mix.he > 0;
              const depths = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
              return (
                <div className="space-y-2">
                  <Label className="text-slate-300">Partial Pressures (ATA)</Label>
                  <div className="rounded-lg overflow-hidden" style={{ border: '1px solid #2a2a2a' }}>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr style={{ background: '#141414' }}>
                            <th className="text-left px-3 py-2 text-slate-400 font-medium">Depth</th>
                            <th className="text-right px-3 py-2 font-medium" style={{ color: '#1a7cff' }}>ppO₂</th>
                            <th className="text-right px-3 py-2 text-slate-400 font-medium">ppN₂</th>
                            {hasHe && <th className="text-right px-3 py-2 text-slate-400 font-medium">ppHe</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {depths.map((d, i) => {
                            const ata = d / 10 + 1;
                            const ppO2 = fO2 * ata;
                            const ppN2 = fN2 * ata;
                            const ppHe = fHe * ata;
                            const isOver14 = ppO2 > 1.4;
                            const isOver16 = ppO2 > 1.6;
                            return (
                              <tr key={d} style={{ background: i % 2 === 0 ? '#0a0a0a' : '#111' }}>
                                <td className="px-3 py-2 text-slate-300 font-medium">{d}m</td>
                                <td className={`px-3 py-2 text-right font-semibold ${isOver16 ? 'text-red-400' : isOver14 ? 'text-amber-400' : ''}`}
                                  style={!isOver14 && !isOver16 ? { color: '#1a7cff' } : {}}>
                                  {ppO2.toFixed(2)}
                                </td>
                                <td className="px-3 py-2 text-right text-slate-300">{ppN2.toFixed(2)}</td>
                                {hasHe && <td className="px-3 py-2 text-right text-slate-400">{ppHe.toFixed(2)}</td>}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="px-3 py-2 flex gap-4 text-xs" style={{ background: '#0d0d0d', borderTop: '1px solid #2a2a2a' }}>
                      <span className="text-amber-400">■ ppO₂ &gt;1.4 (working limit)</span>
                      <span className="text-red-400">■ ppO₂ &gt;1.6 (absolute max)</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="space-y-2">
              <Label className="text-slate-300">Deco Algorithm</Label>
              <MobileSelect
                value={algorithm}
                onValueChange={setAlgorithm}
                options={Object.entries(ALGORITHM_LABELS).map(([k, v]) => ({ value: k, label: v }))}
                placeholder="Algorithm"
                triggerClassName="bg-slate-900/50 border-slate-600 text-white"
              />
            </div>
            <Button onClick={calculate} className="w-full hover:opacity-90" style={{ background: '#1a7cff' }}>
              Calculate
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {(result.isOverMod || result.isPpO2High) && (
            <Card className="bg-red-900/30 border-red-500/50">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="text-red-300 text-sm">
                    {result.isOverMod && <p>Depth exceeds MOD for {gasMix}!</p>}
                    {result.isPpO2High && <p>ppO2 exceeds safe limit (1.4 ATA)!</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="pt-4 text-center">
                <p className="text-slate-400 text-xs uppercase tracking-wide">MOD</p>
                <p className="text-2xl font-bold mt-1" style={{ color: '#1a7cff' }}>{result.mod}m</p>
              </CardContent>
            </Card>
            <Card className={`border-slate-700/50 ${result.isPpO2High ? 'bg-red-900/30' : 'bg-slate-800/50'}`}>
              <CardContent className="pt-4 text-center">
                <p className="text-slate-400 text-xs uppercase tracking-wide">ppO2</p>
                <p className={`text-2xl font-bold mt-1 ${result.isPpO2High ? 'text-red-400' : 'text-white'}`}>{result.ppO2}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="pt-4 text-center">
                <p className="text-slate-400 text-xs uppercase tracking-wide">END</p>
                <p className="text-2xl font-bold mt-1" style={{ color: '#1a7cff' }}>{result.end}m</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="pt-4 text-center">
                <p className="text-slate-400 text-xs uppercase tracking-wide">Deco Time</p>
                <p className="text-2xl font-bold mt-1" style={{ color: '#1a7cff' }}>{result.decoTime} min</p>
              </CardContent>
            </Card>
          </div>

          {result.decoStops.length > 0 && (
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-base">Deco Stops</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.decoStops.map((stop, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-slate-700/50 last:border-0">
                      <span className="text-slate-300">{stop.depth}m</span>
                      <span className="font-medium" style={{ color: '#1a7cff' }}>{stop.time} min</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <SavePlanButton planData={{
            type: 'OC',
            depth: parseFloat(depth),
            bottom_time: parseFloat(bottomTime),
            gas_mix: gasMix,
            algorithm,
            mod: result.mod,
            end: result.end,
            deco_time: result.decoTime,
            deco_stops: result.decoStops.map(s => `${s.depth}m/${s.time}min`).join(', ')
          }} />

          <div className="flex items-start gap-2 text-xs text-slate-500 px-1">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>{algorithm === 'simple' ? 'Simplified rule-of-thumb planner.' : `${ALGORITHM_LABELS[algorithm]} model.`} Always verify with certified dive planning software for actual dives.</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
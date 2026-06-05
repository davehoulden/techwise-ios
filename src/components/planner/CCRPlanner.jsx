import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Cpu, AlertTriangle, Info, Circle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { calculateDecoStops, ALGORITHM_LABELS } from './decoAlgorithms';
import SavePlanButton from './SavePlanButton';
import MobileSelect from '@/components/ui/MobileSelect';

const DILUENTS = {
  'Air':          { o2: 21, he: 0 },
  'Trimix 21/35': { o2: 21, he: 35 },
  'Trimix 18/45': { o2: 18, he: 45 },
  'Trimix 15/55': { o2: 15, he: 55 },
  'Trimix 10/70': { o2: 10, he: 70 },
};

const BAILOUT_OPTIONS = [
  { value: 'air',    label: 'Air (21%)',        o2: 21,  he: 0  },
  { value: 'nx32',   label: 'Nitrox 32',        o2: 32,  he: 0  },
  { value: 'nx36',   label: 'Nitrox 36',        o2: 36,  he: 0  },
  { value: 'nx50',   label: 'Nitrox 50 (deco)', o2: 50,  he: 0  },
  { value: 'o2',     label: 'Oxygen 100%',      o2: 100, he: 0  },
  { value: 'tx2135', label: 'Trimix 21/35',     o2: 21,  he: 35 },
  { value: 'tx1845', label: 'Trimix 18/45',     o2: 18,  he: 45 },
  { value: 'tx1555', label: 'Trimix 15/55',     o2: 15,  he: 55 },
];

const DESCENT_RATE = 18; // m/min
const ASCENT_RATE  = 9;  // m/min

function otuPerMin(ppO2) {
  return ppO2 > 0.5 ? Math.pow((ppO2 - 0.5) / 0.5, 5 / 6) : 0;
}

function cnsRatePerMin(ppO2) {
  if (ppO2 >= 1.6) return 2.22;
  if (ppO2 >= 1.5) return 1.11;
  if (ppO2 >= 1.4) return 0.83;
  if (ppO2 >= 1.3) return 0.56;
  if (ppO2 >= 1.2) return 0.40;
  if (ppO2 >= 1.1) return 0.29;
  return 0.14;
}

export default function CCRPlanner() {
  const [depth, setDepth]           = useState('');
  const [bottomTime, setBottomTime] = useState('');
  const [setpoint, setSetpoint]     = useState('1.3');
  const [diluent, setDiluent]       = useState('Trimix 21/35');
  const [algorithm, setAlgorithm]   = useState('simple');
  const [bailout, setBailout]       = useState(null);
  const [result, setResult]         = useState(null);

  const calculate = () => {
    const d  = parseFloat(depth);
    const bt = parseFloat(bottomTime);
    const sp = parseFloat(setpoint);
    const dil = DILUENTS[diluent];
    if (!d || !bt || !sp) return;

    const ata            = d / 10 + 1;
    const descentTime    = Math.ceil(d / DESCENT_RATE);
    const ascentTime     = Math.ceil(d / ASCENT_RATE);
    const loopO2Fraction = sp / ata;

    const mod    = dil.o2 > 0 ? Math.floor(((sp / (dil.o2 / 100)) - 1) * 10) : 999;
    const dilMod = dil.o2 > 0 ? Math.floor(((1.4 / (dil.o2 / 100)) - 1) * 10) : 999;

    const dilN2Fraction     = (100 - dil.o2 - dil.he) / 100;
    const dilFractionInLoop = Math.max(0, (ata - sp) / ata);
    const narcoticPressure  = sp + dilN2Fraction * dilFractionInLoop * ata;
    const end = Math.max(0, Math.floor((narcoticPressure - 1) * 10));

    const decoStops = calculateDecoStops(algorithm, d, bt, dil.o2 / 100, dil.he / 100, true, sp);
    const decoTime  = decoStops.reduce((sum, s) => sum + s.time, 0);
    const totalDiveTime = descentTime + bt + decoTime + ascentTime;

    const totalOTU = Math.round(
      descentTime * otuPerMin(sp) + bt * otuPerMin(sp) + decoTime * otuPerMin(sp)
    );
    const cnsRate  = cnsRatePerMin(sp);
    const totalCNS = Math.round((descentTime + bt + decoTime) * cnsRate);

    setResult({
      descentTime, ascentTime, totalDiveTime, totalOTU, totalCNS,
      loopO2: (loopO2Fraction * 100).toFixed(1),
      mod, dilMod, end, decoTime, decoStops,
      scrubberWarning: (descentTime + bt + decoTime) > 150,
      isSetpointOverMod: d > mod,
      isDiluentMod: d > dilMod,
      isCnsHigh: totalCNS > 80,
      isOtuHigh: totalOTU > 300,
    });
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Cpu className="w-5 h-5" style={{ color: '#1a7cff' }} />
              CCR Dive Parameters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Depth (m)</Label>
                <Input type="number" value={depth} onChange={(e) => setDepth(e.target.value)}
                  placeholder="60" className="bg-slate-900/50 border-slate-600 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Bottom Time (min)</Label>
                <Input type="number" value={bottomTime} onChange={(e) => setBottomTime(e.target.value)}
                  placeholder="45" className="bg-slate-900/50 border-slate-600 text-white" />
              </div>
            </div>

            {depth && (
              <div className="rounded-lg px-4 py-2 text-sm flex justify-between items-center"
                style={{ background: '#1a7cff11', border: '1px solid #1a7cff33' }}>
                <span className="text-slate-400">Estimated descent time</span>
                <span className="font-semibold" style={{ color: '#1a7cff' }}>
                  {Math.ceil(parseFloat(depth) / DESCENT_RATE)} min @ {DESCENT_RATE}m/min
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">ppO2 Setpoint (ATA)</Label>
                <MobileSelect
                  value={setpoint}
                  onValueChange={setSetpoint}
                  options={[
                    { value: '0.7', label: '0.7 (travel/ascent)' },
                    { value: '1.0', label: '1.0' },
                    { value: '1.1', label: '1.1' },
                    { value: '1.2', label: '1.2' },
                    { value: '1.3', label: '1.3 (standard)' },
                    { value: '1.4', label: '1.4 (high)' },
                    { value: '1.6', label: '1.6 (deco max)' },
                  ]}
                  placeholder="ppO₂ Setpoint"
                  triggerClassName="bg-slate-900/50 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Diluent</Label>
                <MobileSelect
                  value={diluent}
                  onValueChange={setDiluent}
                  options={Object.keys(DILUENTS).map(d => ({ value: d, label: d }))}
                  placeholder="Diluent"
                  triggerClassName="bg-slate-900/50 border-slate-600 text-white"
                />
              </div>
            </div>

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

            {/* Bailout Cylinder — single select */}
            <div className="space-y-2">
              <Label className="text-slate-300">Bailout Cylinder</Label>
              <div className="grid grid-cols-2 gap-2">
                {BAILOUT_OPTIONS.map(opt => {
                  const selected = bailout === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setBailout(prev => prev === opt.value ? null : opt.value)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all text-left"
                      style={{
                        background: selected ? '#1a7cff22' : '#0a0a0a',
                        border: selected ? '1px solid #1a7cff88' : '1px solid #2a2a2a',
                        color: selected ? '#ffffff' : '#888',
                      }}
                    >
                      {selected
                        ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: '#1a7cff' }} />
                        : <Circle className="w-4 h-4 flex-shrink-0 text-slate-600" />}
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              {!bailout && (
                <p className="text-xs text-slate-500">Select your bailout cylinder.</p>
              )}
            </div>

            <Button onClick={calculate} className="w-full hover:opacity-90" style={{ background: '#1a7cff' }}>
              Calculate
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

          {(result.isSetpointOverMod || result.isDiluentMod || result.isCnsHigh || result.isOtuHigh || result.scrubberWarning) && (
            <Card className="bg-red-900/30 border-red-500/50">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="text-red-300 text-sm space-y-1">
                    {result.isSetpointOverMod && <p>Depth exceeds setpoint MOD ({result.mod}m for {setpoint} ATA setpoint).</p>}
                    {result.isDiluentMod && <p>Depth exceeds diluent MOD ({result.dilMod}m for {diluent}).</p>}
                    {result.isCnsHigh && <p>CNS O2 toxicity high: {result.totalCNS}% — consider reducing setpoint or bottom time.</p>}
                    {result.isOtuHigh && <p>OTU high: {result.totalOTU} — approaching daily limit of 600 OTU.</p>}
                    {result.scrubberWarning && <p>Dive time may exceed scrubber duration — verify canister endurance.</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dive Timeline */}
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-base">Dive Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {[
                { label: 'Descent',       value: `${result.descentTime} min` },
                { label: 'Bottom Time',   value: `${bottomTime} min` },
                { label: 'Decompression', value: `${result.decoTime} min` },
                { label: 'Ascent',        value: `${result.ascentTime} min` },
              ].map(row => (
                <div key={row.label} className="flex justify-between items-center py-1 border-b border-slate-700/40 last:border-0">
                  <span className="text-slate-400">{row.label}</span>
                  <span className="font-medium text-white">{row.value}</span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2 mt-1 border-t border-slate-600">
                <span className="text-white font-semibold">Total Dive Time</span>
                <span className="text-xl font-bold" style={{ color: '#1a7cff' }}>{result.totalDiveTime} min</span>
              </div>
            </CardContent>
          </Card>

          {/* O2 Toxicity */}
          <div className="grid grid-cols-3 gap-3">
            <Card className={`border-slate-700/50 ${result.isOtuHigh ? 'bg-red-900/30' : 'bg-slate-800/50'}`}>
              <CardContent className="pt-4 text-center">
                <p className="text-slate-400 text-xs uppercase tracking-wide">OTUs</p>
                <p className={`text-2xl font-bold mt-1 ${result.isOtuHigh ? 'text-red-400' : 'text-white'}`}>{result.totalOTU}</p>
              </CardContent>
            </Card>
            <Card className={`border-slate-700/50 ${result.isCnsHigh ? 'bg-red-900/30' : 'bg-slate-800/50'}`}>
              <CardContent className="pt-4 text-center">
                <p className="text-slate-400 text-xs uppercase tracking-wide">%CNS</p>
                <p className={`text-2xl font-bold mt-1 ${result.isCnsHigh ? 'text-red-400' : 'text-white'}`}>{result.totalCNS}%</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="pt-4 text-center">
                <p className="text-slate-400 text-xs uppercase tracking-wide">END</p>
                <p className="text-2xl font-bold mt-1" style={{ color: '#1a7cff' }}>{result.end}m</p>
              </CardContent>
            </Card>
          </div>

          {/* MOD Info */}
          <Card className="bg-slate-900/50 border-slate-700/30">
            <CardContent className="pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Setpoint MOD ({setpoint} ATA)</span>
                <span className="font-medium" style={{ color: result.isSetpointOverMod ? '#ef4444' : '#1a7cff' }}>{result.mod}m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Diluent MOD (1.4 ATA)</span>
                <span className="font-medium" style={{ color: result.isDiluentMod ? '#ef4444' : '#1a7cff' }}>{result.dilMod}m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Loop O2%</span>
                <span className="font-medium" style={{ color: '#1a7cff' }}>{result.loopO2}%</span>
              </div>
            </CardContent>
          </Card>

          {/* Deco Schedule */}
          {result.decoStops.length > 0 ? (
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-base">Decompression Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between text-xs text-slate-500 uppercase tracking-wide pb-2 border-b border-slate-700/50">
                  <span>Depth</span>
                  <span>Stop Time</span>
                </div>
                {result.decoStops.map((stop, i) => (
                  <div key={i} className="flex justify-between items-center py-2.5 border-b border-slate-700/30 last:border-0">
                    <span className="text-slate-300 font-medium">{stop.depth}m</span>
                    <span className="font-bold" style={{ color: '#1a7cff' }}>{stop.time} min</span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-3 border-t border-slate-600 mt-1">
                  <span className="text-white font-semibold">Total Deco</span>
                  <span className="font-bold text-white">{result.decoTime} min</span>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="pt-4 text-center text-slate-400 text-sm py-6">
                No decompression required for this profile.
              </CardContent>
            </Card>
          )}

          {/* Bailout summary */}
          {bailout && (
            <Card className="bg-slate-900/50 border-slate-700/30">
              <CardContent className="pt-4">
                <p className="text-slate-400 text-xs uppercase tracking-wide mb-2">Bailout Cylinder</p>
                <span className="text-xs px-2 py-1 rounded-md font-medium"
                  style={{ background: '#1a7cff22', color: '#1a7cff', border: '1px solid #1a7cff44' }}>
                  {BAILOUT_OPTIONS.find(o => o.value === bailout)?.label}
                </span>
              </CardContent>
            </Card>
          )}

          <SavePlanButton planData={{
            type: 'CCR',
            depth: parseFloat(depth),
            bottom_time: parseFloat(bottomTime),
            gas_mix: diluent,
            algorithm,
            setpoint: parseFloat(setpoint),
            mod: result.mod,
            end: result.end,
            deco_time: result.decoTime,
            deco_stops: result.decoStops.map(s => `${s.depth}m/${s.time}min`).join(', ')
          }} />

          <div className="flex items-start gap-2 text-xs text-slate-500 px-1">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>{algorithm === 'simple' ? 'Simplified rule-of-thumb estimates.' : `${ALGORITHM_LABELS[algorithm]} model.`} Always use a calibrated CCR computer and certified dive planning software for actual dives. OTU and CNS values are approximations.</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
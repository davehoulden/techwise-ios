import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, LineChart, Line, ComposedChart
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { Award, TrendingDown, Clock, Waves, MapPin, Star, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const BRAND = '#1a7cff';
const CARD_BG = 'bg-slate-800/50 border-slate-700/50';

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <Card className={CARD_BG}>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#1a7cff18' }}>
          <Icon className="w-4 h-4" style={{ color: BRAND }} />
        </div>
        <div>
          <p className="text-lg font-bold text-white leading-none">{value}</p>
          <p className="text-xs text-slate-400 mt-0.5">{label}</p>
          {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

const CustomTooltip = ({ active, payload, label, unit }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white shadow-xl">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <span className="font-bold">{p.value}{unit || ''}</span></p>
      ))}
    </div>
  );
};

export default function DiveStats({ dives }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Filter dives by date range
  const filteredDives = useMemo(() => {
    return dives.filter(d => {
      if (!d.date) return false;
      const diveDate = new Date(d.date);
      if (startDate) {
        const start = new Date(startDate);
        if (diveDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (diveDate > end) return false;
      }
      return true;
    });
  }, [dives, startDate, endDate]);

  const sorted = useMemo(() => [...filteredDives].sort((a, b) => (a.date || '').localeCompare(b.date || '')), [filteredDives]);

  // Depth trend over time
  const depthTrend = useMemo(() => sorted.slice(-20).map(d => ({
    label: d.date ? format(parseISO(d.date), 'MMM d') : '',
    depth: d.max_depth || 0,
    time: d.bottom_time || 0,
  })), [sorted]);

  // Site popularity
  const sitePopularity = useMemo(() => {
    const counts = {};
    filteredDives.forEach(d => {
      if (d.location) counts[d.location] = (counts[d.location] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([site, count]) => ({ site: site.length > 14 ? site.slice(0, 13) + '…' : site, count }));
  }, [filteredDives]);

  // Dive frequency over time (monthly)
  const diveFrequency = useMemo(() => {
    const months = {};
    sorted.forEach(d => {
      if (!d.date) return;
      const month = format(parseISO(d.date), 'MMM yyyy');
      months[month] = (months[month] || 0) + 1;
    });
    return Object.entries(months)
      .map(([month, count]) => ({ month, dives: count }));
  }, [sorted]);

  // Depth distribution (bins)
  const depthDistribution = useMemo(() => {
    const bins = { '0-10m': 0, '10-20m': 0, '20-30m': 0, '30-40m': 0, '40m+': 0 };
    filteredDives.forEach(d => {
      const depth = d.max_depth || 0;
      if (depth < 10) bins['0-10m']++;
      else if (depth < 20) bins['10-20m']++;
      else if (depth < 30) bins['20-30m']++;
      else if (depth < 40) bins['30-40m']++;
      else bins['40m+']++;
    });
    return Object.entries(bins).map(([range, count]) => ({ range, count }));
  }, [filteredDives]);

  // Key stats
  const totalDives = filteredDives.length;
  const maxDepth = filteredDives.length > 0 ? Math.max(...filteredDives.map(d => d.max_depth || 0)) : 0;
  const totalMin = filteredDives.reduce((s, d) => s + (d.bottom_time || 0), 0);
  const avgDepth = totalDives ? (filteredDives.reduce((s, d) => s + (d.max_depth || 0), 0) / totalDives).toFixed(1) : 0;
  const avgBottomTime = totalDives ? (totalMin / totalDives).toFixed(0) : 0;
  const avgRating = totalDives ? (filteredDives.filter(d => d.rating).reduce((s, d) => s + d.rating, 0) / (filteredDives.filter(d => d.rating).length || 1)).toFixed(1) : 0;
  const uniqueSites = new Set(filteredDives.map(d => d.location).filter(Boolean)).size;

  // Achievements
  const achievements = [];
  if (totalDives >= 1) achievements.push({ label: 'First Dive', icon: '🌊' });
  if (totalDives >= 10) achievements.push({ label: '10 Dives', icon: '🔟' });
  if (totalDives >= 50) achievements.push({ label: '50 Dives', icon: '🏅' });
  if (totalDives >= 100) achievements.push({ label: 'Century Diver', icon: '💯' });
  if (maxDepth >= 30) achievements.push({ label: '30m Club', icon: '⬇️' });
  if (maxDepth >= 40) achievements.push({ label: '40m Club', icon: '🎯' });
  if (maxDepth >= 60) achievements.push({ label: '60m Deep', icon: '🌑' });
  if (uniqueSites >= 5) achievements.push({ label: '5 Sites', icon: '📍' });
  if (uniqueSites >= 10) achievements.push({ label: 'Explorer', icon: '🗺️' });
  if (totalMin >= 1000) achievements.push({ label: '1000 Min Underwater', icon: '⏱️' });

  if (dives.length === 0) {
    return (
      <div className="text-center py-16">
        <Waves className="w-10 h-10 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-400">Log some dives to see your stats</p>
      </div>
    );
  }

  const clearDateFilter = () => {
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="space-y-5">
      {/* Date Range Filter */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 space-y-3">
        <h3 className="text-sm text-slate-300 font-medium">Date Range Filter</h3>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Start Date</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">End Date</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white text-sm"
            />
          </div>
        </div>
        {(startDate || endDate) && (
          <Button
            onClick={clearDateFilter}
            variant="outline"
            size="sm"
            className="w-full text-slate-400 border-slate-700"
          >
            <X className="w-3.5 h-3.5 mr-1.5" />
            Clear Date Filter
          </Button>
        )}
      </div>

      {/* Key stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={Waves} label="Total Dives" value={totalDives} />
        <StatCard icon={TrendingDown} label="Max Depth" value={`${maxDepth}m`} sub={`Avg ${avgDepth}m`} />
        <StatCard icon={Clock} label="Total Time" value={`${totalMin} min`} sub={`Avg ${avgBottomTime} min`} />
        <StatCard icon={MapPin} label="Dive Sites" value={uniqueSites} />
        <StatCard icon={Star} label="Avg Rating" value={`${avgRating} / 5`} />
        <StatCard icon={Award} label="Achievements" value={achievements.length} />
      </div>

      {/* Depth profile chart */}
      {depthTrend.length > 1 && (
        <Card className={CARD_BG}>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm text-slate-300 font-medium">Depth Profile (last 20 dives)</CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={depthTrend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="depthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={BRAND} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={BRAND} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} reversed />
                <Tooltip content={<CustomTooltip unit="m" />} />
                <Area type="monotone" dataKey="depth" name="Depth" stroke={BRAND} fill="url(#depthGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Bottom time trend */}
      {depthTrend.length > 1 && (
        <Card className={CARD_BG}>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm text-slate-300 font-medium">Bottom Time Trend (last 20 dives)</CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={depthTrend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="timeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip unit=" min" />} />
                <Area type="monotone" dataKey="time" name="Bottom Time" stroke="#22d3ee" fill="url(#timeGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Dive Frequency */}
      {diveFrequency.length > 1 && (
        <Card className={CARD_BG}>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm text-slate-300 font-medium">Dive Frequency Over Time</CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={diveFrequency} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} angle={-45} textAnchor="end" height={80} />
                <YAxis tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip unit=" dives" />} />
                <Bar dataKey="dives" name="Dives" fill={BRAND} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Depth Distribution */}
      {depthDistribution.some(d => d.count > 0) && (
        <Card className={CARD_BG}>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm text-slate-300 font-medium">Depth Distribution</CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={depthDistribution} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <XAxis dataKey="range" tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip unit=" dives" />} />
                <Bar dataKey="count" name="Dives" fill="#22d3ee" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Site popularity */}
      {sitePopularity.length > 0 && (
        <Card className={CARD_BG}>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm text-slate-300 font-medium">Top Dive Sites</CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            <ResponsiveContainer width="100%" height={Math.max(120, sitePopularity.length * 32)}>
              <BarChart data={sitePopularity} layout="vertical" margin={{ top: 0, right: 20, left: 4, bottom: 0 }}>
                <XAxis type="number" tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="site" tick={{ fill: '#aaa', fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
                <Tooltip content={<CustomTooltip unit=" dives" />} />
                <Bar dataKey="count" name="Dives" radius={[0, 6, 6, 0]}>
                  {sitePopularity.map((_, i) => (
                    <Cell key={i} fill={`hsl(${210 + i * 18}, 80%, ${55 - i * 3}%)`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Achievements */}
      {achievements.length > 0 && (
        <Card className={CARD_BG}>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm text-slate-300 font-medium">Achievements</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="flex flex-wrap gap-2">
              {achievements.map((a, i) => (
                <span key={i} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full text-slate-200"
                  style={{ background: '#1a7cff20', border: '1px solid #1a7cff40' }}>
                  <span>{a.icon}</span>{a.label}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
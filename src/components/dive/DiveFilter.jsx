import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronDown, X, Search } from 'lucide-react';
import MobileSelect from '@/components/ui/MobileSelect';

const GAS_MIX_OPTIONS = ['Air', 'Nitrox 32', 'Nitrox 36', 'Trimix 21/35', 'Trimix 18/45', 'Trimix 15/55', 'Helitrox']
  .map(v => ({ value: v, label: v }));

export default function DiveFilter({ dives, divePlans, onFilterChange }) {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [filters, setFilters] = useState({
    location: '',
    startDate: '',
    endDate: '',
    maxDepth: '',
    gasMix: '',
    planId: ''
  });

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    applyFilters(search, newFilters);
  };

  const handleSearchChange = (value) => {
    setSearch(value);
    applyFilters(value, filters);
  };

  const applyFilters = (searchTerm, filterValues) => {
    const filtered = dives.filter(dive => {
      // Search term in location or notes
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesSearch = (dive.location?.toLowerCase().includes(term) ||
          dive.notes?.toLowerCase().includes(term));
        if (!matchesSearch) return false;
      }

      // Location filter
      if (filterValues.location && !dive.location?.toLowerCase().includes(filterValues.location.toLowerCase())) {
        return false;
      }

      // Date range filter
      const diveDate = new Date(dive.date);
      if (filterValues.startDate) {
        const startDate = new Date(filterValues.startDate);
        if (diveDate < startDate) return false;
      }
      if (filterValues.endDate) {
        const endDate = new Date(filterValues.endDate);
        endDate.setHours(23, 59, 59, 999);
        if (diveDate > endDate) return false;
      }

      // Max depth filter
      if (filterValues.maxDepth) {
        const maxDepthValue = parseFloat(filterValues.maxDepth);
        if (dive.max_depth > maxDepthValue) return false;
      }

      // Gas mix filter
      if (filterValues.gasMix && dive.gas_mix !== filterValues.gasMix) {
        return false;
      }

      // Dive plan filter
      if (filterValues.planId && dive.dive_plan_id !== filterValues.planId) {
        return false;
      }

      return true;
    });

    onFilterChange(filtered);
  };

  const hasActiveFilters = search || Object.values(filters).some(v => v !== '');

  const clearFilters = () => {
    setSearch('');
    setFilters({
      location: '',
      startDate: '',
      endDate: '',
      maxDepth: '',
      gasMix: '',
      planId: ''
    });
    onFilterChange(dives);
  };

  return (
    <div className="px-5 py-3 border-b border-slate-800">
      {/* Search Bar */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
        <Input
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search location or notes..."
          className="bg-slate-800 border-slate-700 text-white pl-9"
        />
      </div>

      {/* Filter Toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-300">Filters</span>
          {hasActiveFilters && (
            <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ background: '#1a7cff30', color: '#1a7cff' }}>
              {Object.values(filters).filter(v => v !== '').length + (search ? 1 : 0)} active
            </span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {/* Expanded Filters */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-3 space-y-3">
              {/* Location */}
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Location</label>
                <Input
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  placeholder="Filter by location"
                  className="bg-slate-800 border-slate-700 text-white text-sm"
                />
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Start Date</label>
                  <Input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">End Date</label>
                  <Input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white text-sm"
                  />
                </div>
              </div>

              {/* Max Depth */}
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Max Depth (m)</label>
                <Input
                  type="number"
                  value={filters.maxDepth}
                  onChange={(e) => handleFilterChange('maxDepth', e.target.value)}
                  placeholder="Filter by maximum depth"
                  className="bg-slate-800 border-slate-700 text-white text-sm"
                />
              </div>

              {/* Gas Mix */}
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Gas Mix</label>
                <MobileSelect
                  value={filters.gasMix}
                  onValueChange={(v) => handleFilterChange('gasMix', v)}
                  options={[{ value: '', label: 'All Gas Mixes' }, ...GAS_MIX_OPTIONS]}
                  placeholder="Gas Mix"
                  triggerClassName="bg-slate-800 border-slate-700 text-white text-sm"
                />
              </div>

              {/* Dive Plan */}
              {divePlans.length > 0 && (
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Linked Plan</label>
                  <MobileSelect
                    value={filters.planId}
                    onValueChange={(v) => handleFilterChange('planId', v)}
                    options={[
                      { value: '', label: 'All Plans' },
                      ...divePlans.map(p => ({ value: p.id, label: p.name }))
                    ]}
                    placeholder="Linked Plan"
                    triggerClassName="bg-slate-800 border-slate-700 text-white text-sm"
                  />
                </div>
              )}

              {/* Clear Button */}
              {hasActiveFilters && (
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  size="sm"
                  className="w-full text-slate-400 border-slate-700"
                >
                  <X className="w-3.5 h-3.5 mr-1.5" />
                  Clear All Filters
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
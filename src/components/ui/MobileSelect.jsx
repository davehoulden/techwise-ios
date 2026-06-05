import React, { useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check } from 'lucide-react';

const isMobile = () => typeof window !== 'undefined' && window.innerWidth < 768;

/**
 * MobileSelect: renders as a native-style bottom-sheet Drawer on mobile,
 * and falls back to the standard Select on desktop.
 *
 * Props: value, onValueChange, options (array of {value, label}), placeholder, triggerClassName
 */
export default function MobileSelect({ value, onValueChange, options, placeholder, triggerClassName }) {
  const [open, setOpen] = useState(false);
  const mobile = isMobile();

  const selectedLabel = options.find(o => o.value === value)?.label ?? placeholder ?? '';

  if (!mobile) {
    return (
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className={triggerClassName}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map(o => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-sm select-none ${triggerClassName}`}
      >
        <span>{selectedLabel}</span>
        <svg className="w-4 h-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="bg-slate-900 border-t border-slate-700">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="text-white text-base">{placeholder || 'Select'}</DrawerTitle>
          </DrawerHeader>
          <div className="pb-8 px-4 space-y-1">
            {options.map(o => (
              <button
                key={o.value}
                type="button"
                onClick={() => { onValueChange(o.value); setOpen(false); }}
                className="w-full flex items-center justify-between px-4 rounded-xl text-left text-white select-none transition-colors"
                style={{ minHeight: '44px' }}
                style={{ background: o.value === value ? '#1a3a5c' : 'transparent' }}
              >
                <span>{o.label}</span>
                {o.value === value && <Check className="w-4 h-4" style={{ color: '#1a7cff' }} />}
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
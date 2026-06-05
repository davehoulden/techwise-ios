import React from 'react';
import { motion } from 'framer-motion';
import { Wrench, Clock, AlertTriangle, MoreVertical, Pencil, Trash2, Calendar } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { differenceInDays, parseISO, format } from 'date-fns';

const CATEGORY_COLORS = {
  Breathing: '#1a7cff',
  Buoyancy: '#06b6d4',
  Exposure: '#8b5cf6',
  Instrumentation: '#f59e0b',
  Safety: '#22c55e',
  Other: '#6b7280',
};

function serviceStatus(nextServiceDate) {
  if (!nextServiceDate) return null;
  const days = differenceInDays(parseISO(nextServiceDate), new Date());
  if (days < 0) return { label: `Overdue by ${Math.abs(days)}d`, color: '#ef4444', icon: 'overdue' };
  if (days <= 30) return { label: `Due in ${days}d`, color: '#f59e0b', icon: 'soon' };
  if (days <= 90) return { label: `Due in ${Math.round(days / 7)}w`, color: '#eab308', icon: 'upcoming' };
  return { label: `Due ${format(parseISO(nextServiceDate), 'd MMM yyyy')}`, color: '#22c55e', icon: 'ok' };
}

export default function EquipmentCard({ item, onEdit, onDelete }) {
  const status = serviceStatus(item.next_service_date);
  const catColor = CATEGORY_COLORS[item.category] || '#6b7280';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="rounded-xl overflow-hidden"
      style={{ background: '#141414', border: '1px solid #2a2a2a' }}
    >
      {/* Top accent line */}
      <div className="h-0.5" style={{ background: catColor }} />

      <div className="px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-white font-semibold text-sm">{item.name}</span>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: catColor + '22', color: catColor }}>
                {item.category}
              </span>
            </div>
            {(item.brand || item.model) && (
              <p className="text-slate-500 text-xs mt-0.5">{[item.brand, item.model].filter(Boolean).join(' · ')}</p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-slate-600 hover:text-white p-1 flex-shrink-0">
                <MoreVertical className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(item)}>
                <Pencil className="w-4 h-4 mr-2" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(item)} className="text-red-400">
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Service info row */}
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          {status && (
            <div className="flex items-center gap-1.5">
              {status.icon === 'overdue'
                ? <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: status.color }} />
                : <Wrench className="w-3.5 h-3.5 flex-shrink-0" style={{ color: status.color }} />}
              <span className="text-xs font-medium" style={{ color: status.color }}>{status.label}</span>
            </div>
          )}
          {item.last_service_date && (
            <div className="flex items-center gap-1 text-slate-500 text-xs">
              <Calendar className="w-3 h-3" />
              <span>Last: {format(parseISO(item.last_service_date), 'd MMM yyyy')}</span>
            </div>
          )}
          {item.usage_hours != null && item.usage_hours !== '' && (
            <div className="flex items-center gap-1 text-slate-500 text-xs">
              <Clock className="w-3 h-3" />
              <span>{item.usage_hours}h</span>
            </div>
          )}
        </div>

        {item.notes && (
          <p className="text-slate-600 text-xs mt-2 italic leading-relaxed">{item.notes}</p>
        )}
      </div>
    </motion.div>
  );
}
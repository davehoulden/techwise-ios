import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, ArrowDown, Thermometer, Star, MoreVertical, Pencil, Trash2, Link2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function DiveCard({ dive, index, onEdit, onDelete, linkedPlan }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="bg-slate-800/50 border-slate-700/50 overflow-hidden">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ color: '#1a7cff', background: '#1a7cff15' }}>
                  #{dive.dive_number || '-'}
                </span>
                {dive.gas_mix && (
                  <span className="text-xs text-slate-400 bg-slate-700/50 px-2 py-0.5 rounded">
                    {dive.gas_mix}
                  </span>
                )}
              </div>
              <h3 className="text-white font-semibold mt-1">{dive.location}</h3>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-slate-400 h-8 w-8">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-red-400">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-slate-900/50 rounded-lg p-2">
              <Calendar className="w-3.5 h-3.5 text-slate-500 mx-auto mb-1" />
              <p className="text-xs text-slate-300">
                {dive.date ? format(new Date(dive.date), 'MMM d') : '-'}
              </p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-2">
              <ArrowDown className="w-3.5 h-3.5 text-slate-500 mx-auto mb-1" />
              <p className="text-xs text-slate-300">{dive.max_depth}m</p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-2">
              <Clock className="w-3.5 h-3.5 text-slate-500 mx-auto mb-1" />
              <p className="text-xs text-slate-300">{dive.bottom_time} min</p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-2">
              <Thermometer className="w-3.5 h-3.5 text-slate-500 mx-auto mb-1" />
              <p className="text-xs text-slate-300">{dive.water_temp || '-'}°C</p>
            </div>
          </div>

          {dive.rating && (
            <div className="flex items-center gap-1 mt-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-3.5 h-3.5 ${
                    star <= dive.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
                  }`}
                />
              ))}
            </div>
          )}

          {dive.notes && (
            <p className="text-xs text-slate-400 mt-3 line-clamp-2">{dive.notes}</p>
          )}

          {linkedPlan && (
            <div className="flex items-center gap-1.5 mt-3 px-2 py-1.5 rounded-lg" style={{ background: '#1a7cff12', border: '1px solid #1a7cff30' }}>
              <Link2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#1a7cff' }} />
              <span className="text-xs" style={{ color: '#1a7cff' }}>
                {linkedPlan.name}
              </span>
              <span className="text-xs text-slate-500 ml-auto">
                {linkedPlan.depth}m · {linkedPlan.bottom_time}min
              </span>
            </div>
          )}

          {dive.photos?.length > 0 && (
            <div className="flex gap-1.5 mt-3 overflow-x-auto">
              {dive.photos.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt=""
                  className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, Calculator, ClipboardList, BookOpen, Wrench } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { differenceInDays, parseISO } from 'date-fns';

const tabs = [
  { label: 'Home', icon: Home, page: 'Home' },
  { label: 'Planner', icon: Calculator, page: 'DivePlanner' },
  { label: 'Log', icon: ClipboardList, page: 'DiveLog' },
  { label: 'Courses', icon: BookOpen, page: 'Courses' },
  { label: 'Equipment', icon: Wrench, page: 'Equipment' },
];

export default function BottomNav({ currentPageName }) {
  const [overdueCount, setOverdueCount] = useState(0);

  useEffect(() => {
    base44.auth.me().then(u => {
      base44.entities.Equipment.filter({ user_email: u.email }).then(items => {
        const count = items.filter(i =>
          i.next_service_date &&
          differenceInDays(parseISO(i.next_service_date), new Date()) < 0
        ).length;
        setOverdueCount(count);
      });
    }).catch(() => {});
  }, []);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex"
      style={{
        background: '#0d0d0dee',
        borderTop: '1px solid #1e1e1e',
        backdropFilter: 'blur(16px)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        minHeight: 'calc(60px + env(safe-area-inset-bottom))',
      }}
    >
      {tabs.map(({ label, icon: Icon, page }) => {
        const isActive = currentPageName === page;
        const showBadge = page === 'Equipment' && overdueCount > 0;
        return (
          <Link
            key={page}
            to={createPageUrl(page)}
            className="flex-1 flex flex-col items-center justify-center gap-1 transition-all select-none"
            style={{ minHeight: '44px', paddingTop: '10px', paddingBottom: '10px', color: isActive ? '#1a7cff' : '#555' }}
            style={{ color: isActive ? '#1a7cff' : '#555' }}
          >
            <div className="relative">
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 1.8} />
              {showBadge && (
                <span
                  className="absolute -top-1.5 -right-2 min-w-[16px] h-4 flex items-center justify-center rounded-full text-white text-[9px] font-bold px-1"
                  style={{ background: '#ef4444', lineHeight: 1 }}
                >
                  {overdueCount > 99 ? '99+' : overdueCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
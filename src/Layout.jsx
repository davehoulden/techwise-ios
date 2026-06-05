import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import BottomNav from './components/nav/BottomNav';

const PAGES_WITH_BOTTOM_NAV = ['Home', 'DivePlanner', 'DiveLog', 'Courses', 'Equipment'];

export default function Layout({ children, currentPageName }) {
  const showNav = PAGES_WITH_BOTTOM_NAV.includes(currentPageName);
  const location = useLocation();
  // Persist scroll positions per page
  const scrollPositions = useRef({});

  useEffect(() => {
    const key = location.pathname;
    // Restore saved scroll position for this page
    const saved = scrollPositions.current[key] ?? 0;
    window.scrollTo({ top: saved, behavior: 'instant' });

    // Save scroll position when leaving
    const onScroll = () => { scrollPositions.current[key] = window.scrollY; };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [location.pathname]);

  // Apply dark class based on system preference
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = (e) => document.documentElement.classList.toggle('dark', e.matches);
    apply(mq);
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        :root {
          --tw-brand: #1a7cff;
          --tw-brand-dark: #0e5fd8;
          --tw-bg-primary: #0a0a0a;
          --tw-bg-secondary: #141414;
          --tw-bg-card: #1a1a1a;
          --tw-border: #2a2a2a;
          --tw-text-primary: #ffffff;
          --tw-text-secondary: #a0a0a0;
          --background: 0 0% 4%;
          --foreground: 0 0% 98%;
        }
        html {
          color-scheme: light dark;
        }
        body {
          background-color: #0a0a0a;
          overscroll-behavior: none;
        }
        button, nav a, svg, [role="button"], [role="tab"] {
          user-select: none;
          -webkit-user-select: none;
        }
        .tw-brand-gradient { background: linear-gradient(135deg, #1a7cff, #0e5fd8); }
        .tw-card { background: #1a1a1a; border: 1px solid #2a2a2a; }
        .tw-card:hover { border-color: #1a7cff44; }
      `}</style>

      {/* Page content — add bottom padding when nav is shown */}
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          style={{ paddingBottom: showNav ? 'calc(60px + env(safe-area-inset-bottom))' : 0 }}
        >
          {children}
        </motion.div>
      </AnimatePresence>

      {showNav && <BottomNav currentPageName={currentPageName} />}
    </div>
  );
}
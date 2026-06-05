import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  const [userName, setUserName] = useState('');

  useEffect(() => {
    base44.auth.me().then(u => {
      setUserName(u?.full_name || u?.email || '');
    }).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      {/* Hero Header */}
      <div className="relative overflow-hidden" style={{ background: '#0d0d0d', borderBottom: '1px solid #1e1e1e' }}>
        <div className="absolute inset-0 opacity-30"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, #1a7cff22 0%, transparent 70%)' }} />

        {/* Settings icon */}
        <div className="absolute top-4 right-4 z-10">
          <Link to={createPageUrl('Settings')}>
            <Button variant="ghost" size="icon" className="text-slate-500 hover:text-white select-none">
              <Settings className="w-5 h-5" />
            </Button>
          </Link>
        </div>

        <div className="relative px-6 pt-12 pb-10 flex flex-col items-center">
          {/* Logo */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a60091c4b89373f8f7404c/cfc491748_image.png"
              alt="TechWise Malta"
              className="h-24 object-contain"
            />
          </motion.div>

          {/* Hero Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="w-full max-w-sm rounded-xl overflow-hidden mb-6"
            style={{ border: '1px solid #1e1e1e' }}
          >
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a60091c4b89373f8f7404c/d4e6c46eb_Screenshot2026-03-02222914.png"
              alt="Technical Diving"
              className="w-full h-40 object-cover"
            />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sm uppercase tracking-widest mb-1"
            style={{ color: '#1a7cff' }}
          >
            Technical Diving
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="text-2xl font-bold text-white text-center tracking-wide"
          >
            Take Your Next Step
          </motion.h1>
          {userName && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="text-slate-400 text-sm mt-2"
            >
              Welcome back, <span className="text-white font-medium">{userName}</span>
            </motion.p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-8 text-center">
        <p className="text-sm text-slate-500">Use the tabs below to navigate</p>
        <p className="text-xs uppercase tracking-widest mt-2" style={{ color: '#333' }}>
          Premier Technical Diver Training · Malta
        </p>
      </div>
    </div>
  );
}
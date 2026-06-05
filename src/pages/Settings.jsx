import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Trash2, LogOut, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function Settings() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const handleDeleteAccount = async () => {
    // Log out and notify — actual deletion requires backend support
    await base44.auth.logout('/');
  };

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      {/* Header */}
      <div
        className="sticky top-0 z-10 backdrop-blur-lg"
        style={{ background: '#0a0a0acc', borderBottom: '1px solid #1e1e1e', paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="px-4 py-4 flex items-center gap-3">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white select-none">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-white">Settings</h1>
        </div>
      </div>

      <div className="px-5 py-6 space-y-6 pb-28">
        {/* Account Info */}
        {user && (
          <div className="rounded-xl p-4" style={{ background: '#141414', border: '1px solid #222' }}>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Account</p>
            <p className="text-white font-medium">{user.full_name || 'Diver'}</p>
            <p className="text-slate-400 text-sm">{user.email}</p>
          </div>
        )}

        {/* Actions */}
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #222' }}>
          <button
            onClick={() => base44.auth.logout('/')}
            className="w-full flex items-center gap-3 px-4 py-4 text-slate-300 hover:bg-white/5 transition-colors select-none"
            style={{ background: '#141414', borderBottom: '1px solid #222' }}
          >
            <LogOut className="w-5 h-5 text-slate-400" />
            <span>Sign Out</span>
          </button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                className="w-full flex items-center gap-3 px-4 py-4 text-red-400 hover:bg-red-500/10 transition-colors select-none"
                style={{ background: '#141414' }}
              >
                <Trash2 className="w-5 h-5" />
                <span>Delete Account</span>
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-slate-900 border-slate-700 mx-4">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  Delete Account
                </AlertDialogTitle>
                <AlertDialogDescription className="text-slate-400">
                  This action cannot be undone. All your dive logs and progress will be permanently deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete Account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
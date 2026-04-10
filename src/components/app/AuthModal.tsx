import React from 'react';
import { X } from 'lucide-react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'login' | 'register';
  onModeChange: (m: 'login' | 'register') => void;
  email: string;
  password: string;
  onEmailChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onSubmit: () => void;
  onProvider: (p: 'google' | 'discord') => void;
  onForgotPassword: () => void;
  busy: boolean;
  error?: string;
}

export function AuthModal({
  isOpen,
  onClose,
  mode,
  onModeChange,
  email,
  password,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onProvider,
  onForgotPassword,
  busy,
  error,
}: AuthModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[230] tf-modal-overlay flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="tf-modal-panel bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}</p>
            <h3 className="text-2xl font-serif font-bold text-slate-900">TruyenForge Account</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="tf-modal-content p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={() => onModeChange('login')}
              className={cn(
                'py-2 rounded-xl font-bold text-sm border',
                mode === 'login' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200',
              )}
            >
              Đăng nhập
            </button>
            <button
              onClick={() => onModeChange('register')}
              className={cn(
                'py-2 rounded-xl font-bold text-sm border',
                mode === 'register' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-slate-600 border-slate-200',
              )}
            >
              Đăng ký
            </button>
          </div>
          <div className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="Email"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder="Mật khẩu"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500"
            />
            {mode === 'login' ? (
              <button
                type="button"
                className="text-xs font-semibold text-indigo-600 hover:underline"
                onClick={onForgotPassword}
              >
                Quên mật khẩu?
              </button>
            ) : null}
            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={() => onProvider('google')}
              disabled={busy}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold hover:border-indigo-200 hover:text-indigo-700 transition-all"
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="" className="w-5 h-5" />
              Google
            </button>
            <button
              type="button"
              onClick={() => onProvider('discord')}
              disabled={busy}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold hover:border-indigo-200 hover:text-indigo-700 transition-all"
            >
              <img src="https://www.svgrepo.com/show/353655/discord-icon.svg" alt="" className="w-5 h-5" />
              Discord
            </button>
          </div>
        </div>
        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 tf-modal-actions">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border text-sm font-bold text-slate-600 hover:bg-slate-100">
            Hủy
          </button>
          <button
            onClick={onSubmit}
            disabled={busy}
            className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 disabled:opacity-60"
          >
            {busy ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

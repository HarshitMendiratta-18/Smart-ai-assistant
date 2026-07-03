"use client";

import React, { createContext, useContext, useState } from 'react';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  type?: 'default' | 'success' | 'destructive' | 'warning';
}

interface ToastContextType {
  toast: (options: Omit<Toast, 'id'>) => void;
  toasts: Toast[];
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = ({ title, description, type = 'default' }: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, description, type }]);
    
    // Auto-dismiss after 4000ms
    setTimeout(() => {
      dismiss(id);
    }, 4000);
  };

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast, toasts, dismiss }}>
      {children}
      {/* Toast container floating in corner */}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex w-full flex-col gap-1 rounded-lg border p-4 shadow-lg backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-5 ${
              t.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                : t.type === 'destructive'
                ? 'bg-destructive/10 border-destructive/30 text-destructive'
                : t.type === 'warning'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                : 'bg-card/90 border-border text-card-foreground'
            }`}
          >
            <div className="flex justify-between items-start">
              <span className="font-semibold text-sm">{t.title}</span>
              <button 
                onClick={() => dismiss(t.id)}
                className="text-xs opacity-50 hover:opacity-100 cursor-pointer transition-opacity"
              >
                ✕
              </button>
            </div>
            {t.description ? <p className="text-xs opacity-80 mt-0.5">{t.description}</p> : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

import { create } from 'zustand';
import type { User, Role } from './types';

interface SessionState {
  user: User | null;
  setUser: (u: User | null) => void;
  online: boolean;
  setOnline: (v: boolean) => void;
  simulateOffline: boolean;
  setSimulateOffline: (v: boolean) => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  toasts: { id: string; msg: string }[];
  pushToast: (msg: string) => void;
  removeToast: (id: string) => void;
}

export const useSession = create<SessionState>((set) => ({
  user: null,
  setUser: (u) => set({ user: u }),
  online: navigator.onLine,
  setOnline: (v) => set({ online: v }),
  simulateOffline: false,
  setSimulateOffline: (v) => set({ simulateOffline: v }),
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  toasts: [],
  pushToast: (msg) => {
    const id = Math.random().toString(36).slice(2);
    set((s) => ({ toasts: [...s.toasts, { id, msg }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter(t => t.id !== id) })), 4000);
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter(t => t.id !== id) }))
}));

export function can(role: Role, perms: { role: Role; module: string; view: boolean; create: boolean; edit: boolean; del: boolean }[], module: string, action: 'view' | 'create' | 'edit' | 'del' = 'view') {
  if (role === 'owner') return true;
  const p = perms.find(x => x.role === role && x.module === module);
  if (!p) return role !== 'entry';
  return p[action];
}

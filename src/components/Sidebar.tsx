import { LayoutDashboard, FolderKanban, ListChecks, Timer, Settings, HelpCircle, Plus } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { UserRole } from '../types/settings';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'projects', icon: FolderKanban, label: 'Projects' },
  { id: 'tasks', icon: ListChecks, label: 'Tasks' },
  { id: 'sla', icon: Timer, label: 'SLA Tracker' },
];

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  onNewProject: () => void;
  userRole: UserRole;
}

export const Sidebar = ({ currentView, onViewChange, onNewProject, userRole }: SidebarProps) => {
  const isArchitect = userRole === 'Architect';

  return (
    <aside className="hidden md:flex flex-col h-screen w-64 fixed left-0 top-0 bg-surface-container-low p-6 space-y-8 z-40 border-r border-outline-variant/5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
          <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>architecture</span>
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-primary font-headline leading-tight">Architect</h2>
          <p className="text-[10px] uppercase font-bold text-primary/60 tracking-widest">Premium Curator</p>
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-headline text-sm font-semibold tracking-wide transition-all duration-300",
              currentView === item.id 
                ? "bg-surface-container-high text-primary shadow-sm" 
                : "text-on-surface/70 hover:bg-surface-container-highest hover:translate-x-1"
            )}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="space-y-4">
        {isArchitect && (
          <button 
            onClick={onNewProject}
            className="w-full primary-gradient text-white py-4 rounded-xl font-headline font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            New Project
          </button>
        )}

        <div className="pt-6 border-t border-outline-variant/10 space-y-1">
          <button 
            onClick={() => onViewChange('settings')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2 rounded-lg font-headline text-sm font-semibold transition-all",
              currentView === 'settings' ? "bg-surface-container-high text-primary" : "text-on-surface/70 hover:bg-surface-container-highest"
            )}
          >
            <Settings size={18} />
            <span>Settings</span>
          </button>
          <a href="#" className="flex items-center gap-3 px-4 py-2 text-on-surface/70 hover:bg-surface-container-highest rounded-lg font-headline text-sm font-semibold transition-all">
            <HelpCircle size={18} />
            <span>Support</span>
          </a>
        </div>
      </div>
    </aside>
  );
};

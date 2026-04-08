import { useState, useRef, useEffect, type ChangeEvent } from 'react';
import { Search as SearchIcon, Bell, Menu, FileDown, Database, Clock, ChevronRight, Shield, User, ChevronDown, Check, Briefcase, Building2, Layout, Inbox, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Project } from '../utils/excel';
import type { UserRole, Specialist, Client } from '../types/settings';
import type { Task } from './TasksView';
import { PasswordModal } from './PasswordModal';

interface SearchResult {
    id: string;
    type: 'project' | 'task' | 'client' | 'specialist';
    title: string;
    subtitle: string;
    projectId?: string; // for tasks
}

interface TopNavProps {
  onSearch: (term: string) => void;
  searchTerm: string;
  onExport: () => void;
  onImport: (file: File) => void;
  projects: Project[];
  tasks: Task[];
  specialists: Specialist[];
  clients: Client[];
  onNotificationClick: (project: Project) => void;
  onSelectResult: (result: { id: string, type: string, projectId?: string }) => void;
  userRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

const MASTER_PASSWORD = 'admin2026';

export const TopNav = ({ onSearch, searchTerm, onExport, onImport, projects, tasks, specialists, clients, onNotificationClick, onSelectResult, userRole, onRoleChange }: TopNavProps) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [query, setQuery] = useState(searchTerm);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  useEffect(() => {
    setQuery(searchTerm);
  }, [searchTerm]);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImport(e.target.files[0]);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRoleSwitch = (target: UserRole) => {
    if (target === 'Architect' && userRole !== 'Architect') {
      setIsPasswordModalOpen(true);
    } else {
      onRoleChange(target);
    }
    setIsProfileOpen(false);
  };

  // Search Logic
  const getSearchResults = (): SearchResult[] => {
    if (!query.trim() || query.length < 2) return [];
    const q = query.toLowerCase();
    const results: SearchResult[] = [];

    // Projects
    projects.filter(p => p.title.toLowerCase().includes(q) || p.client.toLowerCase().includes(q))
      .slice(0, 4)
      .forEach(p => results.push({ id: p.id, type: 'project', title: p.title, subtitle: p.client }));

    // Tasks
    tasks.filter(t => t.description.toLowerCase().includes(q))
      .slice(0, 4)
      .forEach(t => results.push({ id: t.id, type: 'task', title: t.description, subtitle: t.projectName, projectId: t.projectId }));

    // Clients
    clients.filter(c => c.name.toLowerCase().includes(q) || c.industry.toLowerCase().includes(q))
      .slice(0, 3)
      .forEach(c => results.push({ id: c.id, type: 'client', title: c.name, subtitle: c.industry }));

    // Specialists
    specialists.filter(s => s.name.toLowerCase().includes(q) || s.role.toLowerCase().includes(q))
      .slice(0, 3)
      .forEach(s => results.push({ id: s.id, type: 'specialist', title: s.name, subtitle: s.role }));

    return results;
  };

  const searchResults = getSearchResults();

  // Notifications logic
  const now = new Date();
  const overdueProjects = projects.filter(p => {
    if (!p.deliveryDate || p.lifecycleStatus === 'Terminado' || p.lifecycleStatus === 'Ganado') return false;
    return new Date(p.deliveryDate) < now;
  });
  const overdueTasks = tasks.filter(t => {
    if (t.status === 'Completed') return false;
    return new Date(t.dueDate) < now;
  });
  const totalAlerts = overdueProjects.length + overdueTasks.length;
  const isArchitect = userRole === 'Architect';

  return (
    <header className="glass-panel sticky top-0 z-50 flex justify-between items-center w-full px-8 py-4 border-b border-outline-variant/10">
      <div className="flex items-center gap-6 flex-1">
        <h1 className="font-headline font-extrabold text-primary tracking-tighter text-xl md:hidden">
          Indigo Horizon
        </h1>
        
        {/* Global Search Container */}
        <div className="relative flex-1 max-w-md hidden md:block" ref={searchRef}>
            <div className={`flex items-center bg-surface-container-low px-4 py-2 rounded-full w-full group transition-all ${isSearchFocused ? 'ring-2 ring-primary/20 shadow-lg' : ''}`}>
                <SearchIcon className={isSearchFocused ? 'text-primary' : 'text-outline'} size={18} />
                <input 
                    type="text" 
                    placeholder="Busca proyectos, especialistas, clientes..." 
                    className="bg-transparent border-none focus:ring-0 text-sm font-bold w-full px-2 text-on-surface placeholder:text-outline/40"
                    value={query}
                    onFocus={() => setIsSearchFocused(true)}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        onSearch(e.target.value);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                            setQuery('');
                            setIsSearchFocused(false);
                            onSearch('');
                        }
                    }}
                />
                {query && (
                    <button onClick={() => { setQuery(''); onSearch(''); }} className="text-outline hover:text-primary"><X size={14}/></button>
                )}
            </div>

            {/* Results Dropdown */}
            <AnimatePresence>
                {isSearchFocused && searchResults.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute left-0 right-0 mt-3 bg-surface rounded-[32px] shadow-2xl border border-outline-variant/10 overflow-hidden z-[100] max-h-[480px] overflow-y-auto custom-scrollbar"
                    >
                        <div className="p-4 space-y-1">
                            {['project', 'task', 'client', 'specialist'].map(type => {
                                const typedResults = searchResults.filter(r => r.type === type);
                                if (typedResults.length === 0) return null;
                                return (
                                    <div key={type} className="mb-4">
                                        <p className="px-4 py-2 text-[10px] font-black text-outline uppercase tracking-widest">{type === 'project' ? 'Proyectos' : type === 'task' ? 'Tareas' : type === 'client' ? 'Clientes' : 'Especialistas'}</p>
                                        <div className="space-y-1">
                                            {typedResults.map(res => (
                                                <button 
                                                    key={res.id}
                                                    onClick={() => {
                                                        onSelectResult(res);
                                                        setQuery('');
                                                        setIsSearchFocused(false);
                                                    }}
                                                    className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-primary/5 transition-all group text-left"
                                                >
                                                    <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-outline group-hover:bg-primary/10 group-hover:text-primary transition-all">
                                                        {type === 'project' ? <Layout size={18} /> : type === 'task' ? <Inbox size={18} /> : type === 'client' ? <Building2 size={18} /> : <Briefcase size={18} />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-bold text-primary truncate">{res.title}</p>
                                                        <p className="text-[10px] text-outline font-medium truncate uppercase tracking-tight">{res.subtitle}</p>
                                                    </div>
                                                    <ChevronRight size={14} className="text-outline/30 opacity-0 group-hover:opacity-100 transition-all" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {isArchitect && (
          <div className="flex items-center gap-2 mr-4">
            <label className="p-2 rounded-full hover:bg-surface-container-low transition-colors cursor-pointer group relative" title="Import from Excel">
              <Database className="text-primary/60 group-hover:text-primary transition-colors" size={20} />
              <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileChange} />
            </label>
            <button 
              onClick={onExport}
              className="p-2 rounded-full hover:bg-surface-container-low transition-colors group relative" 
              title="Export to Excel"
            >
              <FileDown className="text-primary/60 group-hover:text-primary transition-colors" size={20} />
            </button>
          </div>
        )}

        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className={`p-2 rounded-full transition-all relative ${isNotificationsOpen ? 'bg-primary text-white shadow-lg' : 'hover:bg-surface-container-low text-primary'}`}
          >
            <Bell size={20} />
            {totalAlerts > 0 && (
              <span className={`absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-error rounded-full border-2 border-surface ${totalAlerts > 0 ? 'animate-pulse' : ''}`}></span>
            )}
          </button>

          <AnimatePresence>
            {isNotificationsOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-3 w-80 bg-surface rounded-[32px] shadow-2xl border border-outline-variant/10 overflow-hidden z-[100]"
              >
                <div className="p-6 border-b border-outline-variant/10 bg-surface-container-lowest/50">
                  <h3 className="text-sm font-black text-primary uppercase tracking-widest flex items-center justify-between">
                    Alertas Críticas
                    {totalAlerts > 0 && <span className="px-2 py-0.5 bg-error text-white text-[9px] rounded-full">{totalAlerts}</span>}
                  </h3>
                </div>

                <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                  {totalAlerts === 0 ? (
                    <div className="p-12 text-center space-y-3">
                      <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center mx-auto text-primary/20">
                        <Check size={24} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-primary uppercase tracking-widest">SLA Optimizado</p>
                        <p className="text-[10px] text-outline font-medium mt-1">No hay proyectos ni tareas vencidas.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="divide-y divide-outline-variant/5">
                      {overdueProjects.map(p => (
                        <NotificationCard 
                          key={p.id}
                          title={p.title}
                          subtitle={`Proyecto Vencido • ${p.client}`}
                          date={p.deliveryDate}
                          type="Project"
                          onClick={() => {
                            onNotificationClick(p);
                            setIsNotificationsOpen(false);
                          }}
                        />
                      ))}
                      {overdueTasks.map(t => {
                        const parentProj = projects.find(p => p.id === t.projectId);
                        return (
                          <NotificationCard 
                            key={t.id}
                            title={t.description}
                            subtitle={`Tarea Atrasada • ${parentProj?.title || 'Global'}`}
                            date={t.dueDate}
                            type="Task"
                            onClick={() => {
                              if (parentProj) {
                                onNotificationClick(parentProj);
                                setIsNotificationsOpen(false);
                              }
                            }}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>

                {totalAlerts > 0 && (
                  <div className="p-4 bg-surface-container-lowest/50 border-t border-outline-variant/10">
                    <button 
                      onClick={() => setIsNotificationsOpen(false)}
                      className="w-full py-2.5 text-[10px] font-bold text-outline hover:text-primary uppercase tracking-widest transition-colors"
                    >
                      Cerrar Panel
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className="h-6 w-[1px] bg-outline-variant/20 mx-2"></div>
        
        <div className="relative" ref={profileRef}>
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-3 group p-1 pr-3 rounded-full hover:bg-surface-container-low transition-all"
          >
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=256&h=256&auto=format&fit=crop" 
                alt="Executive" 
                className="w-10 h-10 rounded-full object-cover border-2 border-surface-container-high group-hover:scale-105 transition-transform"
              />
              <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-surface flex items-center justify-center ${userRole === 'Architect' ? 'bg-primary' : 'bg-secondary'}`}>
                {userRole === 'Architect' ? <Shield size={8} className="text-white" /> : <User size={8} className="text-white" />}
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <div className="flex items-center justify-end gap-2">
                <p className={`text-xs font-black uppercase tracking-widest ${userRole === 'Architect' ? 'text-primary' : 'text-secondary'}`}>
                  {userRole === 'Architect' ? 'Arquitecto' : 'Especialista'}
                </p>
                <ChevronDown size={12} className="text-outline" />
              </div>
            </div>
          </button>

          <AnimatePresence>
            {isProfileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-3 w-56 bg-surface rounded-[24px] shadow-2xl border border-outline-variant/10 overflow-hidden z-[100] p-2"
              >
                <p className="text-[10px] font-black text-outline uppercase tracking-widest px-4 py-3 border-b border-outline-variant/5 mb-1">Cambiar Rol</p>
                
                <button 
                  onClick={() => handleRoleSwitch('Architect')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${userRole === 'Architect' ? 'bg-primary/10 text-primary' : 'hover:bg-surface-container-low text-on-surface/70'}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${userRole === 'Architect' ? 'bg-primary text-white' : 'bg-surface-container-high'}`}>
                    <Shield size={16} />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold leading-none">Arquitecto</p>
                    <p className="text-[9px] text-outline mt-1 font-medium">Control Total</p>
                  </div>
                </button>

                <button 
                  onClick={() => handleRoleSwitch('Specialist')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${userRole === 'Specialist' ? 'bg-secondary/10 text-secondary' : 'hover:bg-surface-container-low text-on-surface/70'}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${userRole === 'Specialist' ? 'bg-secondary text-white' : 'bg-surface-container-high'}`}>
                    <User size={16} />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold leading-none">Especialista</p>
                    <p className="text-[9px] text-outline mt-1 font-medium">Solo Lectura</p>
                  </div>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <button className="md:hidden p-2 rounded-full hover:bg-surface-container-low transition-colors">
          <Menu className="text-primary" size={20} />
        </button>
      </div>

      <PasswordModal 
        isOpen={isPasswordModalOpen} 
        onClose={() => setIsPasswordModalOpen(false)} 
        onSuccess={() => onRoleChange('Architect')}
        masterPassword={MASTER_PASSWORD}
      />
    </header>
  );
};

const NotificationCard = ({ title, subtitle, date, onClick, type }: { title: string, subtitle: string, date: string, onClick: () => void, type: 'Project' | 'Task' }) => {
  const diffDays = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
  
  return (
    <button 
      onClick={onClick}
      className="w-full p-5 text-left hover:bg-primary/5 transition-all flex items-start justify-between gap-4 group"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`w-1.5 h-1.5 rounded-full ${type === 'Project' ? 'bg-error' : 'bg-tertiary-fixed'}`}></span>
          <p className="text-[9px] font-bold text-outline uppercase tracking-widest truncate">{subtitle}</p>
        </div>
        <p className="text-sm font-bold text-primary leading-snug line-clamp-2">{title}</p>
        <div className="flex items-center gap-2 mt-2">
          <Clock size={12} className="text-error" />
          <p className="text-[10px] font-medium text-error">{diffDays}d atrasado</p>
        </div>
      </div>
      <div className="p-2 rounded-xl bg-surface group-hover:bg-primary/10 transition-colors self-center">
        <ChevronRight size={16} className="text-outline group-hover:text-primary transition-colors" />
      </div>
    </button>
  );
};

import { useState, useEffect } from 'react';
import { X, MoreVertical, ChevronDown, Check, Save, Trash2, Clock, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Project } from '../utils/excel';
import type { Task } from './TasksView';
import type { Specialist, Client, UserRole } from '../types/settings';

interface ProjectDetailsProps {
  project: Project | null;
  tasks: Task[];
  onClose: () => void;
  onUpdate: (project: Project) => void;
  onDelete?: (id: string) => void;
  specialists: Specialist[];
  clients: Client[];
  userRole: UserRole;
}

const statusOptions = ['Por iniciar', 'Iniciado', 'En proceso', 'Detenido', 'Entregado', 'Terminado', 'Ganado'];

const lifecycleProgress: Record<string, number> = {
  'Por iniciar': 0, 'Iniciado': 15, 'En proceso': 45,
  'Detenido': 45, 'Entregado': 80, 'Terminado': 95, 'Ganado': 100,
};


export const ProjectDetails = ({ project, tasks, onClose, onUpdate, onDelete, specialists, clients, userRole }: ProjectDetailsProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [localStatus, setLocalStatus]       = useState<string>('En proceso');
  const [localNotes, setLocalNotes]         = useState<string>('');
  const [localImages, setLocalImages]       = useState<string[]>([]);
  const [localDates, setLocalDates]         = useState({ 
    startDate: '', 
    deliveryDate: '' 
  });
  const [localTeam, setLocalTeam]           = useState({
    solutionsArchitect: '',
    projectLeader: '',
    salesperson: ''
  });
  const [localTitle, setLocalTitle]         = useState<string>('');
  const [localClient, setLocalClient]       = useState<string>('');
  const [isEditingBaseInfo, setIsEditingBaseInfo] = useState(false);
  const [saved, setSaved]                   = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [expandedSpecialists, setExpandedSpecialists] = useState<Record<string, boolean>>({});

  const isArchitect = userRole === 'Architect';

  useEffect(() => {
    if (project) {
      setLocalTitle(project.title);
      setLocalClient(project.client);
      setLocalStatus(project.lifecycleStatus || 'En proceso');
      setLocalNotes(project.referentialNotes || '');
      setLocalImages(project.referentialImages || []);
      setLocalDates({
        startDate: project.startDate || new Date().toISOString().split('T')[0],
        deliveryDate: project.deliveryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
      setLocalTeam({
        solutionsArchitect: project.solutionsArchitect || '',
        projectLeader: project.projectLeader || '',
        salesperson: project.salesperson || ''
      });
      setSaved(false);
      setExpandedSpecialists({});
      setIsEditingBaseInfo(false);
    }
  }, [project?.id]);

  if (!project) return null;

  const clientInfo = clients.find(c => c.name === localClient);
  const clientDisplay = clientInfo ? `${localClient} (${clientInfo.industry})` : localClient;

  const computedProgress = lifecycleProgress[localStatus] ?? project.progress;
  const hasChanged = localStatus !== (project.lifecycleStatus || 'En proceso')
    || localTitle !== project.title
    || localClient !== project.client
    || localNotes !== (project.referentialNotes || '')
    || JSON.stringify(localImages) !== JSON.stringify(project.referentialImages || [])
    || localDates.startDate !== project.startDate
    || localDates.deliveryDate !== project.deliveryDate
    || localTeam.solutionsArchitect !== project.solutionsArchitect
    || localTeam.projectLeader !== project.projectLeader
    || localTeam.salesperson !== project.salesperson;

  const handleSave = () => {
    if (!isArchitect) return;
    onUpdate({ 
      ...project, 
      title: localTitle,
      client: localClient,
      lifecycleStatus: localStatus as any, 
      progress: computedProgress, 
      referentialNotes: localNotes, 
      referentialImages: localImages,
      startDate: localDates.startDate,
      deliveryDate: localDates.deliveryDate,
      solutionsArchitect: localTeam.solutionsArchitect,
      projectLeader: localTeam.projectLeader,
      salesperson: localTeam.salesperson
    });
    setSaved(true);
    setIsEditingBaseInfo(false);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleSpecialist = (name: string) => {
    setExpandedSpecialists(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const projectTasks = tasks.filter(t => t.projectId === project.id);
  const now = new Date();

  const specialistMap: Record<string, { name: string; total: number; onTime: number; overdue: number; taskList: Task[] }> = {};
  projectTasks.forEach(t => {
    if (!specialistMap[t.specialist]) {
      specialistMap[t.specialist] = { name: t.specialist, total: 0, onTime: 0, overdue: 0, taskList: [] };
    }
    specialistMap[t.specialist].total++;
    specialistMap[t.specialist].taskList.push(t);
    const due = new Date(t.dueDate);
    if (t.status === 'Completed') {
      specialistMap[t.specialist].onTime++;
    } else if (due < now) {
      specialistMap[t.specialist].overdue++;
    }
  });
  const projectSpecialists = Object.values(specialistMap);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[70] flex justify-end pointer-events-none">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-on-background/10 backdrop-blur-[2px] pointer-events-auto"
        />
        <motion.div
          initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="relative bg-surface w-full max-w-xl shadow-2xl overflow-y-auto pointer-events-auto flex flex-col border-l border-outline-variant/10"
        >
          {/* Header */}
          <div className="p-8 border-b border-outline-variant/10 flex justify-between items-start bg-surface-container-lowest/50 backdrop-blur-md sticky top-0 z-20">
            <div className="space-y-2 flex-1 mr-4">
              <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                project.status === 'On Track' ? 'bg-secondary-container text-on-secondary-container' :
                project.status === 'At Risk'  ? 'bg-tertiary-fixed text-on-tertiary-fixed-variant' :
                'bg-error-container text-on-error-container'
              }`}>{project.status}</span>
              
              {isEditingBaseInfo && isArchitect ? (
                <div className="space-y-4 mt-4 animate-in fade-in slide-in-from-top-2">
                   <div className="space-y-1">
                      <label className="text-[9px] font-bold text-primary uppercase tracking-widest ml-1">Project Name</label>
                      <input 
                        className="w-full bg-surface-container-low border-2 border-primary/20 rounded-xl p-3 text-sm font-extrabold text-primary focus:ring-0 focus:border-primary/40 transition-all font-headline"
                        value={localTitle}
                        onChange={e => setLocalTitle(e.target.value)}
                      />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[9px] font-bold text-primary uppercase tracking-widest ml-1">Client Entity</label>
                      <div className="relative bg-surface-container-low rounded-xl border-2 border-primary/20">
                        <select 
                          className="w-full bg-transparent border-none focus:ring-0 text-xs font-bold text-primary px-3 py-3 appearance-none cursor-pointer"
                          value={localClient}
                          onChange={e => setLocalClient(e.target.value)}
                        >
                          {clients.map(c => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-primary/50 pointer-events-none">▾</div>
                      </div>
                   </div>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-headline font-extrabold text-primary leading-tight tracking-tight mt-4">{localTitle}</h2>
                  <p className="text-sm font-semibold text-outline tracking-tight">{clientDisplay}</p>
                </>
              )}
            </div>
            <button onClick={onClose} className="p-2.5 hover:bg-surface-container-low rounded-xl transition-all text-outline hover:text-primary"><X size={20} /></button>
          </div>

          {/* Content */}
          <div className="flex-1 p-8 space-y-12 pb-32 md:pb-40">
            {!isArchitect && (
              <div className="bg-secondary/10 border border-secondary/20 p-4 rounded-2xl flex items-center gap-3">
                <UserIcon size={20} className="text-secondary" />
                <p className="text-xs font-bold text-secondary uppercase tracking-widest">Modo Especialista: Vista de Solo Lectura</p>
              </div>
            )}

            {/* ── Timeline ────────────────────────────────────── */}
            <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/10 space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-bold text-outline uppercase tracking-widest">Project Timeline</h4>
                <div className="flex items-center gap-1.5 text-[9px] font-bold text-primary/40 uppercase tracking-widest">
                  <Clock size={12} />
                  Created: {new Date(project.createdAt).toLocaleDateString()}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-outline uppercase tracking-widest ml-1">Start Date</label>
                  <input 
                    type="date"
                    disabled={!isArchitect}
                    className="w-full bg-surface-container-low border-none rounded-xl p-3 text-sm font-bold text-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    value={localDates.startDate}
                    onChange={e => setLocalDates(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-outline uppercase tracking-widest ml-1">Delivery Target</label>
                  <input 
                    type="date"
                    disabled={!isArchitect}
                    className="w-full bg-surface-container-low border-none rounded-xl p-3 text-sm font-bold text-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    value={localDates.deliveryDate}
                    onChange={e => setLocalDates(prev => ({ ...prev, deliveryDate: e.target.value }))}
                  />
                </div>
              </div>

              {/* Progress Line */}
              <div className="relative h-2 bg-surface-container-low rounded-full overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-gradient-to-r from-primary to-secondary" />
                <motion.div 
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: computedProgress / 100 }}
                  transition={{ duration: 0.8 }}
                  className="absolute inset-0 bg-primary origin-left"
                />
              </div>
            </div>

            {/* ── Project Team ────────────────────────────────── */}
            <div className="space-y-4">
              <h4 className="text-[11px] font-bold text-outline uppercase tracking-widest">Project Team</h4>
              <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/10 space-y-6">
                
                <div className="grid grid-cols-1 gap-6">
                  {/* Solutions Architect Selector */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-outline uppercase tracking-widest ml-1">Arquitecto de Soluciones</label>
                    <div className="relative bg-surface-container-low rounded-2xl">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary border border-primary/20 text-[10px] pointer-events-none">
                        {localTeam.solutionsArchitect.split(' ').map(n => n[0]).join('')}
                      </div>
                      <select 
                        disabled={!isArchitect}
                        className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold text-primary pl-16 pr-10 py-4 appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        value={localTeam.solutionsArchitect}
                        onChange={e => setLocalTeam(prev => ({ ...prev, solutionsArchitect: e.target.value }))}
                      >
                        {specialists.map(s => (
                          <option key={s.id} value={s.name}>{s.name} ({s.role})</option>
                        ))}
                      </select>
                      {isArchitect && <div className="absolute right-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none">▾</div>}
                    </div>
                  </div>

                  {/* Project Leader Selector */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-outline uppercase tracking-widest ml-1">Líder del Proyecto</label>
                    <div className="relative bg-surface-container-low rounded-2xl">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center font-bold text-secondary border border-secondary/20 text-[10px] pointer-events-none">
                        {localTeam.projectLeader.split(' ').map(n => n[0]).join('')}
                      </div>
                      <select 
                        disabled={!isArchitect}
                        className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold text-primary pl-16 pr-10 py-4 appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        value={localTeam.projectLeader}
                        onChange={e => setLocalTeam(prev => ({ ...prev, projectLeader: e.target.value }))}
                      >
                        {specialists.map(s => (
                          <option key={s.id} value={s.name}>{s.name} ({s.role})</option>
                        ))}
                      </select>
                      {isArchitect && <div className="absolute right-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none">▾</div>}
                    </div>
                  </div>

                  {/* Salesperson Selector */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-outline uppercase tracking-widest ml-1">Vendedor (Salesperson)</label>
                    <div className="relative bg-surface-container-low rounded-2xl">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-tertiary-fixed/10 flex items-center justify-center font-bold text-on-tertiary-fixed-variant border border-tertiary-fixed/20 text-[10px] pointer-events-none">
                        {localTeam.salesperson.split(' ').map(n => n[0]).join('')}
                      </div>
                      <select 
                        disabled={!isArchitect}
                        className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold text-primary pl-16 pr-10 py-4 appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        value={localTeam.salesperson}
                        onChange={e => setLocalTeam(prev => ({ ...prev, salesperson: e.target.value }))}
                      >
                        {specialists.map(s => (
                          <option key={s.id} value={s.name}>{s.name} ({s.role})</option>
                        ))}
                      </select>
                      {isArchitect && <div className="absolute right-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none">▾</div>}
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Progress + Lifecycle */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-container-low p-6 rounded-3xl space-y-3 border border-outline-variant/5">
                <p className="text-[10px] font-bold text-outline uppercase tracking-widest leading-none">Architecture Progress</p>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-headline font-extrabold text-primary">{computedProgress}%</span>
                  {hasChanged && <span className="text-[9px] text-primary/60 font-bold uppercase mb-1">Preview</span>}
                </div>
                <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
                  <motion.div
                    animate={{ width: `${computedProgress}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className={`h-full rounded-full ${localStatus === 'Ganado' ? 'bg-secondary' : localStatus === 'Detenido' ? 'bg-error/60' : 'bg-primary'}`}
                  />
                </div>
              </div>

              <div className="relative">
                <button
                  disabled={!isArchitect}
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`w-full text-left p-6 rounded-3xl space-y-2 transition-all border-2 ${hasChanged ? 'bg-primary/5 border-primary/30' : 'bg-surface-container-low border-transparent hover:border-primary/20'} disabled:opacity-70 disabled:cursor-not-allowed`}
                >
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest leading-none flex items-center justify-between">
                    Lifecycle Phase
                    {isArchitect && <ChevronDown size={14} className={`transform transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />}
                  </p>
                  <div className="flex items-end gap-2 mt-1">
                    <span className="text-xl font-headline font-extrabold text-primary leading-tight">{localStatus}</span>
                  </div>
                </button>
                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="absolute right-0 left-0 top-full mt-2 bg-surface-container-high rounded-3xl shadow-2xl z-30 overflow-hidden border border-outline-variant/10"
                    >
                      {statusOptions.map(status => (
                        <button key={status} onClick={() => { setLocalStatus(status); setIsDropdownOpen(false); }}
                          className="w-full px-6 py-4 text-left text-sm font-bold text-primary hover:bg-primary/5 transition-all flex items-center justify-between"
                        >
                          {status}
                          {localStatus === status && <Check size={16} className="text-primary" />}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* ── Arquitectura Referencial ─────────────────────── */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-bold text-outline uppercase tracking-widest">Arquitectura Referencial</h4>
                {isArchitect && (
                  <button onClick={() => setIsEditingNotes(v => !v)}
                    className="text-[10px] font-bold text-primary hover:underline uppercase tracking-widest px-3 py-1 bg-primary/5 rounded-lg"
                  >{isEditingNotes ? 'Finalizar' : 'Editar'}</button>
                )}
              </div>

              {isEditingNotes && isArchitect ? (
                <textarea
                  value={localNotes}
                  onChange={e => setLocalNotes(e.target.value)}
                  placeholder="Describe la arquitectura referencial, tecnologías..."
                  rows={4}
                  className="w-full bg-surface-container-low border-2 border-primary/20 rounded-2xl p-5 text-sm text-primary font-medium focus:ring-0 focus:border-primary/40 resize-none transition-all"
                />
              ) : (
                <div
                  className={`bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10 min-h-[80px] transition-all group ${isArchitect ? 'cursor-pointer hover:border-primary/20' : ''}`}
                  onClick={() => isArchitect && setIsEditingNotes(true)}
                >
                  {localNotes
                    ? <p className="text-sm text-primary leading-relaxed whitespace-pre-wrap">{localNotes}</p>
                    : <p className="text-sm text-outline/40 italic">No technical notes provided for this project.</p>}
                </div>
              )}
            </div>

            {/* ── Trazabilidad por Especialista ─────────────── */}
            <div className="space-y-6">
              <h4 className="text-[11px] font-bold text-outline uppercase tracking-widest">Trazabilidad por Especialista</h4>
              
              {projectSpecialists.length === 0 ? (
                <div className="bg-surface-container-lowest p-8 rounded-[32px] border border-dashed border-outline-variant/20 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-3xl bg-surface-container-low flex items-center justify-center text-outline/30 mb-4">
                        <UserIcon size={32} />
                    </div>
                    <p className="text-sm font-bold text-outline">No specialists assigned to tasks on this project yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {projectSpecialists.map(sp => {
                    const isExpanded = expandedSpecialists[sp.name];
                    return (
                      <div key={sp.name} className="group overflow-hidden rounded-3xl border border-outline-variant/10 bg-surface-container-lowest transition-all hover:shadow-lg hover:shadow-primary/5">
                        <button 
                          onClick={() => toggleSpecialist(sp.name)}
                          className="w-full p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center font-black text-primary border border-primary/20 text-sm">
                              {sp.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <p className="font-headline font-extrabold text-primary text-base leading-tight">{sp.name}</p>
                              <p className="text-[10px] font-bold text-outline uppercase tracking-widest mt-1">{sp.total} Tareas asignadas</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-8">
                            <div className="flex gap-4">
                                <div className="text-center">
                                    <p className="text-secondary font-black text-lg leading-none">{sp.onTime}</p>
                                    <p className="text-[8px] font-bold text-outline uppercase tracking-widest mt-1 text-secondary/60">SLA OK</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-error font-black text-lg leading-none">{sp.overdue}</p>
                                    <p className="text-[8px] font-bold text-outline uppercase tracking-widest mt-1 text-error/60">Vencidas</p>
                                </div>
                            </div>
                            <div className={`p-2 rounded-xl transition-all ${isExpanded ? 'bg-primary text-white' : 'bg-surface text-outline group-hover:text-primary group-hover:bg-primary/5'}`}>
                                <ChevronDown size={20} className={`transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                            </div>
                          </div>
                        </button>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="border-t border-outline-variant/10 bg-surface-container-lowest/50"
                            >
                              <div className="p-4 space-y-2">
                                {sp.taskList.map(task => {
                                  const isTaskOverdue = task.status === 'Pending' && new Date(task.dueDate) < now;
                                  return (
                                    <div key={task.id} className="p-4 rounded-xl bg-surface border border-outline-variant/10 flex items-center justify-between gap-4 group/task hover:border-primary/20 transition-all text-on-surface">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                                                task.priority === 'Critical' ? 'bg-error text-white' :
                                                task.priority === 'High' ? 'bg-tertiary-fixed text-on-tertiary-fixed-variant' :
                                                'bg-primary/10 text-primary'
                                            }`}>
                                                {task.priority}
                                            </span>
                                        </div>
                                        <p className={`text-sm font-semibold leading-snug ${task.status === 'Completed' ? 'text-outline/40 line-through' : 'text-primary'}`}>
                                          {task.description}
                                        </p>
                                      </div>
                                      <div className="text-right shrink-0">
                                        <p className={`text-xs font-bold leading-none ${isTaskOverdue ? 'text-error' : task.status === 'Completed' ? 'text-outline/40' : 'text-primary'}`}>
                                            {new Date(task.dueDate).toLocaleDateString('es', { month: 'short', day: 'numeric' })}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          <div className="p-8 bg-surface-container-low/80 backdrop-blur-md sticky bottom-0 flex gap-4 border-t border-outline-variant/10 mt-auto">
            {isArchitect && (
              <>
                {onDelete && (
                    <button 
                      onClick={() => {
                        if (confirm(`¿Estás seguro de que deseas eliminar el proyecto "${project.title}"?`)) {
                            onDelete(project.id);
                        }
                      }}
                      className="p-4 bg-error/10 text-error rounded-2xl hover:bg-error/20 transition-all border border-error/20"
                    >
                      <Trash2 size={20} />
                    </button>
                )}
                <button onClick={handleSave}
                  className={`flex-1 p-4 rounded-2xl font-headline font-bold text-center text-sm shadow-xl flex items-center justify-center gap-3 transition-all ${
                    saved ? 'bg-secondary text-white' :
                    hasChanged ? 'bg-primary text-white shadow-primary/20 animate-pulse' :
                    'bg-primary text-white'
                  }`}
                >
                  <Save size={18} />
                  {saved ? 'Cambios Guardados' : hasChanged ? 'Guardar Cambios' : 'Sincronizado'}
                </button>
              </>
            )}
            
            {!isArchitect && (
              <button onClick={onClose} className="flex-1 p-4 bg-primary text-white rounded-2xl font-headline font-bold text-center text-sm shadow-xl">
                Cerrar Vista
              </button>
            )}

            <button 
              onClick={() => isArchitect && setIsEditingBaseInfo(!isEditingBaseInfo)}
              className={`p-4 rounded-2xl font-bold transition-all shadow-sm border border-outline-variant/10 ${
                isEditingBaseInfo ? 'bg-primary text-white' : 'bg-surface text-primary hover:bg-surface-container-high'
              } ${!isArchitect ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <MoreVertical size={20} />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

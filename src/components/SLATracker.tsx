import { useState, useRef, useEffect } from 'react';
import { Timer, CheckCircle, AlertOctagon, MoreVertical, X, Save, Clock, Trash2, CalendarCheck, Shield, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Task } from './TasksView';
import type { Project } from '../utils/excel';
import type { Specialist, UserRole } from '../types/settings';

export interface SLATask {
  id: string;
  project: string;
  specialist: string;
  task: string;
  slaHours: number;
  startTime: string;
  completedAt?: string;
  status: 'In Progress' | 'At Risk' | 'Overdue' | 'Completed';
}

interface SLATrackerProps {
  initialTasks: SLATask[];
  projects: Project[];
  specialists: Specialist[];
  tasks?: Task[];           // live tasks from App state
  userRole: UserRole;
  onUpdateLiveTask?: (task: Task) => void;
  onDeleteLiveTask?: (id: string) => void;
}

const SLA_TARGETS = [12, 24, 48, 72, 96];
const STATUS_OPTIONS: SLATask['status'][] = ['In Progress', 'At Risk', 'Overdue', 'Completed'];

const PRIORITY_SLA: Record<string, number> = { Critical: 24, High: 48, Standard: 72, Low: 96 };
const SLA_TO_PRIORITY: Record<number, Task['priority']> = { 24: 'Critical', 48: 'High', 72: 'Standard', 96: 'Low' };

const statusColors: Record<string, string> = {
  Completed:    'bg-secondary-container text-on-secondary-container',
  'At Risk':    'bg-tertiary-fixed text-on-tertiary-fixed-variant',
  Overdue:      'bg-error-container text-on-error-container',
  'In Progress':'bg-surface-container-high text-primary',
};

// ── Helpers ──────────────────────────────────────────────────────────
function humanElapsed(isoFrom: string): string {
  const ms = Date.now() - new Date(isoFrom).getTime();
  const h  = Math.floor(ms / 3600000);
  const d  = Math.floor(h / 24);
  if (d > 0)  return `${d}d ${h % 24}h`;
  if (h > 0)  return `${h}h`;
  const m = Math.floor(ms / 60000);
  return m > 0 ? `${m}m` : 'just now';
}

function humanDue(isoDate: string): string {
  const ms  = new Date(isoDate).getTime() - Date.now();
  const abs = Math.abs(ms);
  const h   = Math.floor(abs / 3600000);
  const d   = Math.floor(h / 24);
  const past = ms < 0;
  const label = d > 0 ? `${d}d ${h % 24}h` : `${h}h`;
  return past ? `${label} atrás` : `en ${label}`;
}

function deriveSLAStatus(task: Task): SLATask['status'] {
  if (task.status === 'Completed') return 'Completed';
  const now       = Date.now();
  const due       = new Date(task.dueDate).getTime();
  const slaHours  = PRIORITY_SLA[task.priority] || 48;
  const created   = task.createdAt ? new Date(task.createdAt).getTime() : due - slaHours * 3600000;
  const elapsed   = (now - created) / 3600000;
  if (now > due)                      return 'Overdue';
  if (elapsed > slaHours * 0.75)      return 'At Risk';
  return 'In Progress';
}

function taskToSLA(t: Task): SLATask {
  return {
    id:         `live-${t.id}`,
    project:    t.projectName,
    specialist: t.specialist,
    task:       t.description,
    slaHours:   PRIORITY_SLA[t.priority] || 48,
    startTime:  t.createdAt || t.dueDate,
    completedAt: t.completedAt,
    status:     deriveSLAStatus(t),
  };
}

// ── Edit Popover (updated for dynamic specialists) ──────────────────
const EditPopover = ({ task, specialists, onSave, onDelete, onClose }: { task: SLATask; specialists: Specialist[]; onSave: (t: SLATask) => void; onDelete: (id: string) => void; onClose: () => void }) => {
  const [form, setForm] = useState({ ...task });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);

  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, scale: 0.92, y: -8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: -8 }}
      transition={{ duration: 0.15 }}
      className="absolute right-0 top-10 z-50 w-80 bg-surface rounded-3xl shadow-2xl border border-outline-variant/10 overflow-hidden"
    >
      <div className="px-6 py-4 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-low/60">
        <span className="text-[10px] font-black text-outline uppercase tracking-widest">Edit SLA Entry</span>
        <button onClick={onClose} className="text-outline hover:text-primary"><X size={16} /></button>
      </div>
      <div className="p-6 space-y-5">
        <div className="space-y-1.5">
          <label className="text-[9px] font-bold text-outline uppercase tracking-widest">Task / Assignment</label>
          <input className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm font-bold text-primary border-none focus:ring-2 focus:ring-primary/20"
            value={form.task} onChange={e => setForm({ ...form, task: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <label className="text-[9px] font-bold text-outline uppercase tracking-widest">Specialist (EP)</label>
          <div className="relative bg-surface-container-low rounded-xl">
            <select className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold px-4 py-3 appearance-none text-primary"
              value={form.specialist} onChange={e => setForm({ ...form, specialist: e.target.value })}>
              {specialists.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-xs">▾</span>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[9px] font-bold text-outline uppercase tracking-widest">SLA Target (hours)</label>
          <div className="flex gap-2 flex-wrap">
            {SLA_TARGETS.map(h => (
              <button key={h} onClick={() => setForm({ ...form, slaHours: h })}
                className={`px-3 py-2 rounded-xl text-[10px] font-bold transition-all border-2 ${form.slaHours === h ? 'bg-primary text-white border-primary scale-105' : 'bg-surface-container-low text-outline border-transparent hover:bg-surface-container-high'}`}
              >{h}h</button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[9px] font-bold text-outline uppercase tracking-widest">Status</label>
          <div className="grid grid-cols-2 gap-2">
            {STATUS_OPTIONS.map(s => (
              <button key={s} onClick={() => setForm({ ...form, status: s })}
                className={`px-3 py-2.5 rounded-xl text-[9px] font-bold transition-all border-2 ${form.status === s ? `${statusColors[s]} border-transparent scale-105` : 'bg-surface-container-low text-outline border-transparent hover:bg-surface-container-high'}`}
              >{s}</button>
            ))}
          </div>
        </div>
        
        <div className="flex gap-2">
            <button 
                onClick={() => { if(confirm('Eliminar esta entrada del tracker?')) { onDelete(task.id); onClose(); } }}
                className="p-3 bg-error/10 text-error rounded-2xl hover:bg-error/20 transition-all"
            ><Trash2 size={18} /></button>
            <button onClick={() => { onSave(form); onClose(); }}
                className="flex-1 py-3 bg-primary text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20">
                <Save size={14} /> Save SLA Entry
            </button>
        </div>
      </div>
    </motion.div>
  );
};

// ── Main SLA Tracker ──────────────────────────────────────────────────
export const SLATracker = ({ initialTasks, projects, specialists, tasks = [], userRole, onUpdateLiveTask, onDeleteLiveTask }: SLATrackerProps) => {
  const [staticTasks, setStaticTasks] = useState<SLATask[]>(initialTasks);
  const [openPopover, setOpenPopover] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const isArchitect = userRole === 'Architect';

  // Convert live tasks to SLA entries
  const liveSLATasks: SLATask[] = tasks.map(taskToSLA);

  // Merge
  const allTasks: SLATask[] = [
    ...staticTasks.map(t => ({ ...t, _source: 'static' as const })),
    ...liveSLATasks.filter(lt => !staticTasks.find(st => st.id === lt.id)).map(t => ({ ...t, _source: 'live' as const })),
  ];

  // Filter out tasks whose project no longer exists
  const activeProjectTitles = new Set(projects.map(p => p.title));
  const validTasks = allTasks.filter(t => activeProjectTitles.has(t.project));

  const filtered = filterStatus === 'All' ? validTasks : validTasks.filter(t => t.status === filterStatus);

  const handleComplete = (id: string) => {
    if (!isArchitect) return;
    const now = new Date().toISOString();
    if (id.startsWith('live-')) {
      const realId = id.replace('live-', '');
      const original = tasks.find(t => t.id === realId);
      if (original && onUpdateLiveTask) {
        onUpdateLiveTask({ ...original, status: 'Completed', completedAt: now });
      }
      return;
    }
    setStaticTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'Completed', completedAt: now } : t));
  };

  const handleSaveTask = (updated: SLATask) => {
    if (!isArchitect) return;
    if (updated.id.startsWith('live-')) {
      const realId = updated.id.replace('live-', '');
      const original = tasks.find(t => t.id === realId);
      if (original && onUpdateLiveTask) {
        onUpdateLiveTask({ 
          ...original, 
          specialist: updated.specialist,
          description: updated.task,
          status: updated.status === 'Completed' ? 'Completed' : 'Pending',
          completedAt: updated.status === 'Completed' ? (original.completedAt || new Date().toISOString()) : undefined,
          priority: (SLA_TO_PRIORITY[updated.slaHours] || original.priority) as Task['priority']
        });
      }
      return;
    }
    setStaticTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
  };

  const handleDeleteSLA = (id: string) => {
    if (!isArchitect) return;
    if (id.startsWith('live-')) {
        const realId = id.replace('live-', '');
        if (onDeleteLiveTask) onDeleteLiveTask(realId);
    } else {
        setStaticTasks(prev => prev.filter(t => t.id !== id));
    }
  };

  const getTimerColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'text-secondary';
      case 'At Risk':   return 'text-on-tertiary-fixed-variant';
      case 'Overdue':   return 'text-error';
      default:          return 'text-primary';
    }
  };

  const counts = {
    overdue:   validTasks.filter(t => t.status === 'Overdue').length,
    atRisk:    validTasks.filter(t => t.status === 'At Risk').length,
    completed: validTasks.filter(t => t.status === 'Completed').length,
    total:     validTasks.length,
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
            {!isArchitect && (
                <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary border border-secondary/20">
                    <UserIcon size={24} />
                </div>
            )}
            <div>
            <h2 className="text-3xl font-headline font-extrabold text-primary tracking-tight">Active SLA Monitoring</h2>
            <p className="text-xs font-bold text-outline uppercase tracking-widest mt-1">
                {counts.total} tareas · {counts.overdue} vencidas · {counts.atRisk} en riesgo · {counts.completed} completadas
                {!isArchitect && <span className="text-secondary ml-2 tracking-tighter">· Modo Lectura</span>}
            </p>
            </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {['All', 'In Progress', 'At Risk', 'Overdue', 'Completed'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border-2 ${
                filterStatus === s ? 'bg-primary text-white border-primary' : 'bg-surface-container-low text-outline border-transparent hover:bg-surface-container-high'
              }`}
            >{s}</button>
          ))}
        </div>
      </div>

      <div className="bg-surface-container-low rounded-3xl overflow-hidden p-1 shadow-sm">
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-[10px] font-bold text-outline uppercase tracking-widest text-left">
                <th className="px-6 py-5">Proyecto / Tarea</th>
                <th className="px-6 py-5">SLA Target</th>
                <th className="px-6 py-5">Asignación</th>
                <th className="px-6 py-5">Seguimiento</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              <AnimatePresence mode="popLayout">
                {filtered.map((task) => {
                  const elapsed = humanElapsed(task.startTime);
                  const isLive  = task.id.startsWith('live-');

                  // Find matching live task to get dueDate
                  const liveSrc = isLive ? tasks.find(t => `live-${t.id}` === task.id) : null;
                  const dueDateStr = liveSrc ? liveSrc.dueDate : '';

                  return (
                    <motion.tr key={task.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="group hover:bg-surface-container-highest/50 transition-all"
                    >
                      {/* Project & Task */}
                      <td className="px-6 py-5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-headline font-bold text-primary text-sm">{task.project}</p>
                            {isLive && <span className="px-2 py-0.5 rounded-full text-[8px] font-bold bg-primary/10 text-primary uppercase tracking-widest">Live</span>}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-outline">{task.task}</span>
                            <span className="w-1 h-1 bg-outline-variant rounded-full" />
                            <span className="text-xs font-bold text-on-surface/80">{task.specialist}</span>
                          </div>
                        </div>
                      </td>

                      {/* SLA Target */}
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <Timer className={getTimerColor(task.status)} size={16} />
                          <span className="text-sm font-bold font-headline text-primary">
                            {task.status === 'Completed' ? 'Cerrado' : `${task.slaHours}h`}
                          </span>
                        </div>
                      </td>

                      {/* Asignación (StartTime) */}
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-outline" />
                          <div>
                            <span className="text-sm font-bold font-headline text-primary">
                                {new Date(task.startTime).toLocaleDateString('es', { month: 'short', day: 'numeric' })}
                            </span>
                            <p className="text-[10px] text-outline uppercase font-bold tracking-tight mt-0.5">
                                {new Date(task.startTime).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Seguimiento / Completada */}
                      <td className="px-6 py-5">
                        {task.status === 'Completed' && task.completedAt ? (
                          <div className="flex items-center gap-2">
                            <CalendarCheck size={14} className="text-secondary" />
                            <div>
                                <span className="text-sm font-bold font-headline text-secondary">
                                    {new Date(task.completedAt).toLocaleDateString('es', { month: 'short', day: 'numeric' })}
                                </span>
                                <p className="text-[10px] text-outline uppercase font-bold tracking-tight mt-0.5 font-headline">
                                    {new Date(task.completedAt).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center gap-2">
                                <span className={`text-sm font-bold font-headline ${task.status === 'Overdue' ? 'text-error' : 'text-primary'}`}>{elapsed} activo</span>
                            </div>
                            {dueDateStr && (
                                <p className="text-[10px] text-outline uppercase font-bold tracking-tight mt-0.5">
                                    Vence {humanDue(dueDateStr)}
                                </p>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${statusColors[task.status]}`}>
                          {task.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isArchitect ? (
                              <>
                                {task.status !== 'Completed' && (
                                    <button onClick={() => handleComplete(task.id)}
                                      className="bg-secondary text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-md shadow-secondary/20"
                                    >Mark Complete</button>
                                  )}
                                  {task.status === 'Completed' && (
                                    <div className="flex items-center gap-2 text-secondary">
                                      <CheckCircle size={16} /><span className="text-[10px] font-bold uppercase tracking-widest">Done</span>
                                    </div>
                                  )}
                                  
                                  <div className="relative">
                                    <button onClick={() => setOpenPopover(openPopover === task.id ? null : task.id)}
                                      className={`p-2 rounded-xl transition-colors ${openPopover === task.id ? 'bg-primary/10 text-primary' : 'text-outline hover:text-primary'}`}
                                    >
                                      <MoreVertical size={18} />
                                    </button>
                                    <AnimatePresence>
                                      {openPopover === task.id && (
                                        <EditPopover 
                                            task={task} 
                                            specialists={specialists}
                                            onSave={handleSaveTask} 
                                            onDelete={handleDeleteSLA}
                                            onClose={() => setOpenPopover(null)} 
                                        />
                                      )}
                                    </AnimatePresence>
                                  </div>
                              </>
                          ) : (
                            <div className="flex items-center gap-2 text-outline/40">
                                <Shield size={14} />
                                <span className="text-[9px] font-bold uppercase tracking-widest">Locked</span>
                            </div>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-outline font-bold uppercase text-xs tracking-widest">No hay entradas con estado "{filterStatus}"</p>
            </div>
          )}
        </div>
      </div>

      {/* Health Note */}
      <div className="bg-surface-container-low/50 rounded-3xl p-6 border border-outline-variant/10 flex items-start gap-4">
        <div className="p-3 bg-primary/10 rounded-2xl text-primary">{isArchitect ? <AlertOctagon size={24} /> : <Shield size={24} />}</div>
        <div>
          <h4 className="text-sm font-bold text-primary font-headline">{isArchitect ? 'Predictive SLA Management' : 'SLA Audit Mode'}</h4>
          <p className="text-xs text-outline leading-relaxed mt-1">
            {isArchitect 
              ? 'Trazabilidad completa: Fecha de asignación vs Fecha de completitud. Las tareas marcadas Live se sincronizan con sus marcas temporales reales.' 
              : 'Estás en modo auditoría. Todas las métricas de SLA son visibles para asegurar la transparencia, pero las modificaciones están restringidas al perfil de Arquitecto.'}
          </p>
        </div>
      </div>
    </div>
  );
};

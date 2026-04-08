import { useState } from 'react';
import { CheckCircle, MoreHorizontal, Plus, ChevronDown, User as UserIcon, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { UserRole } from '../types/settings';

export interface Task {
  id: string;
  projectId: string;
  projectName: string;
  specialist: string;
  description: string;
  dueDate: string;
  createdAt?: string;
  completedAt?: string;
  priority: 'Critical' | 'High' | 'Standard' | 'Low';
  status: 'Pending' | 'Completed';
}

interface TasksViewProps {
  tasks: Task[];
  onToggle: (id: string) => void;
  onNewTask: () => void;
  onEditTask: (task: Task) => void;
  userRole: UserRole;
}

type SortMode = 'chronological' | 'specialist' | 'project';

const priorityGlow: Record<string, string> = {
  Critical: 'shadow-[0_0_12px_rgba(186,26,26,0.15)] bg-error text-white',
  High:     'shadow-[0_0_12px_rgba(255,165,0,0.15)] bg-tertiary-fixed text-on-tertiary-fixed-variant',
  Standard: 'bg-primary text-white',
  Low:      'bg-surface-container-high text-outline',
};

function getDayBucket(dueDate: string): string {
  const date  = new Date(dueDate);
  const today = new Date(); today.setHours(0,0,0,0);
  const tom   = new Date(today); tom.setDate(today.getDate() + 1);
  const week  = new Date(today); week.setDate(today.getDate() + 7);
  if (date < today) return '🔴 Vencidas';
  if (date < tom)   return '⚡ Vence Hoy';
  if (date < week)  return '📅 Esta Semana';
  return '🗓 Próximas';
}

const BUCKET_ORDER = ['🔴 Vencidas', '⚡ Vence Hoy', '📅 Esta Semana', '🗓 Próximas'];

// ── Task Card ─────────────────────────────────────────────────────────
const TaskCard = ({ task, onToggle, onEditTask, userRole }: { task: Task; onToggle: (id: string) => void; onEditTask: (t: Task) => void, userRole: UserRole }) => {
  const isArchitect = userRole === 'Architect';
  const dueDate  = new Date(task.dueDate);
  const isOverdue = task.status === 'Pending' && dueDate < new Date();
  const elapsed  = task.createdAt
    ? (() => {
        const ms = Date.now() - new Date(task.createdAt).getTime();
        const h  = Math.floor(ms / 3600000);
        const d  = Math.floor(h / 24);
        return d > 0 ? `${d}d ${h % 24}h` : h > 0 ? `${h}h` : `${Math.floor(ms / 60000)}m`;
      })()
    : null;

  return (
    <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className={`p-5 rounded-2xl group hover:bg-surface-container-low transition-all duration-200 flex items-center gap-4 ${isOverdue ? 'bg-error/5' : 'bg-surface-container-lowest'}`}
    >
      <button 
        disabled={!isArchitect}
        onClick={() => onToggle(task.id)}
        className={`w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center shrink-0 ${
          task.status === 'Completed' ? 'bg-secondary border-secondary text-white' : `${isOverdue ? 'border-error/40' : 'border-outline-variant/30'} text-transparent ${isArchitect ? 'hover:border-primary' : ''}`
        } disabled:cursor-not-allowed`}
      >
        <CheckCircle size={16} />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-tighter ${priorityGlow[task.priority]}`}>
            {task.priority}
          </span>
        </div>
        <p className={`font-headline font-semibold text-base leading-tight truncate ${task.status === 'Completed' ? 'text-outline line-through' : isOverdue ? 'text-error' : 'text-primary'}`}>
          {task.description}
        </p>
        {elapsed && (
          <p className="text-[10px] text-outline mt-0.5">Activa hace <strong>{elapsed}</strong></p>
        )}
      </div>

      <div className="hidden md:flex items-center gap-6 text-right shrink-0">
        <div>
          <p className="text-[9px] font-bold text-outline uppercase tracking-widest mb-0.5">Specialist</p>
          <p className="text-xs font-bold text-on-surface/80">{task.specialist}</p>
        </div>
        <div className="w-16">
          <p className="text-[9px] font-bold text-outline uppercase tracking-widest mb-0.5">Vence</p>
          <p className={`text-sm font-bold font-headline ${isOverdue ? 'text-error' : 'text-primary'}`}>
            {dueDate.toLocaleDateString('es', { month: 'short', day: 'numeric' })}
          </p>
        </div>
      </div>

      {isArchitect && (
        <button onClick={() => onEditTask(task)} className="p-2 text-outline hover:text-primary transition-colors shrink-0">
          <MoreHorizontal size={18} />
        </button>
      )}
    </motion.div>
  );
};

// ── Collapsible Group ─────────────────────────────────────────────────
const TaskGroup = ({ label, tasks, badge, onToggle, onEditTask, userRole }: {
  label: string; tasks: Task[]; badge?: string;
  onToggle: (id: string) => void; onEditTask: (t: Task) => void; userRole: UserRole;
}) => {
  const [open, setOpen] = useState(true);
  const pending   = tasks.filter(t => t.status === 'Pending').length;
  const overdue   = tasks.filter(t => t.status === 'Pending' && new Date(t.dueDate) < new Date()).length;

  return (
    <div className="space-y-2">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 group/header"
      >
        <span className={`text-[10px] font-black uppercase tracking-widest ${overdue > 0 ? 'text-error' : 'text-outline'}`}>{label}</span>
        {badge && <span className="text-[9px] font-bold text-outline/50 uppercase tracking-widest">{badge}</span>}
        <span className="flex-1 h-px bg-outline-variant/10 group-hover/header:bg-outline-variant/20 transition-colors" />
        <span className="text-[9px] font-bold text-outline">{pending > 0 ? `${pending} pendiente${pending !== 1 ? 's' : ''}` : 'todas completas'}</span>
        <ChevronDown size={14} className={`text-outline transition-transform shrink-0 ${open ? '' : '-rotate-90'}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }} className="overflow-hidden space-y-1.5"
          >
            {tasks.map(t => <TaskCard key={t.id} task={t} onToggle={onToggle} onEditTask={onEditTask} userRole={userRole} />)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Main View ─────────────────────────────────────────────────────────
export const TasksView = ({ tasks = [], onToggle, onNewTask, onEditTask, userRole }: TasksViewProps) => {
  const [sortMode, setSortMode] = useState<SortMode>('chronological');
  const isArchitect = userRole === 'Architect';

  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const sorted    = [...safeTasks].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  // ── Build groups depending on mode ──────────────────────────────
  type Group = { key: string; label: string; badge?: string; tasks: Task[] };
  let groups: Group[] = [];

  if (sortMode === 'chronological') {
    const projectOrder = [...new Set(sorted.map(t => t.projectName))];
    groups = projectOrder.map(proj => {
      const projectTasks = sorted.filter(t => t.projectName === proj);
      const overdue = projectTasks.filter(t => t.status === 'Pending' && new Date(t.dueDate) < new Date()).length;
      return {
        key:   proj,
        label: proj,
        badge: overdue > 0 ? `⚠ ${overdue} vencida${overdue !== 1 ? 's' : ''}` : '',
        tasks: projectTasks,
      };
    });
  } else if (sortMode === 'specialist') {
    const specialists = [...new Set(sorted.map(t => t.specialist))].sort();
    groups = specialists.map(sp => {
      const spTasks   = sorted.filter(t => t.specialist === sp);
      const pending   = spTasks.filter(t => t.status === 'Pending');
      const overdue   = pending.filter(t => new Date(t.dueDate) < new Date()).length;
      return {
        key:   sp,
        label: sp,
        badge: `${pending.length} en cola${overdue > 0 ? ` · ⚠ ${overdue} vencida${overdue !== 1 ? 's' : ''}` : ''}`,
        tasks: spTasks,
      };
    });
  } else {
    const projectOrder = [...new Set(sorted.map(t => t.projectName))];
    for (const proj of projectOrder) {
      const projectTasks = sorted.filter(t => t.projectName === proj);
      for (const bucket of BUCKET_ORDER) {
        const bucketTasks = projectTasks.filter(t => getDayBucket(t.dueDate) === bucket);
        if (bucketTasks.length === 0) continue;
        groups.push({ key: `${proj}__${bucket}`, label: bucket, badge: proj, tasks: bucketTasks });
      }
    }
  }

  const totalPending = safeTasks.filter(t => t.status === 'Pending').length;

  const MODES: { id: SortMode; label: string }[] = [
    { id: 'chronological', label: 'Por Proyecto' },
    { id: 'specialist',    label: 'Por Especialista' },
    { id: 'project',       label: 'Proyecto + Tiempo' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          {!isArchitect && (
            <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary border border-secondary/20">
               <UserIcon size={24} />
            </div>
          )}
          <div>
            <h2 className="text-3xl font-headline font-extrabold text-primary tracking-tight">Systemic Tasks</h2>
            <p className="text-xs font-bold text-outline uppercase tracking-widest mt-1">
              {totalPending} pendiente{totalPending !== 1 ? 's' : ''} · {safeTasks.filter(t => t.status === 'Completed').length} completadas
              {!isArchitect && <span className="text-secondary ml-2 ml-2 tracking-tighter">· Modo Lectura</span>}
            </p>
          </div>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          {MODES.map(m => (
            <button key={m.id} onClick={() => setSortMode(m.id)}
              className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${sortMode === m.id ? 'bg-primary text-white' : 'bg-surface-container-low text-outline hover:bg-surface-container-high'}`}
            >{m.label}</button>
          ))}
          {isArchitect && (
            <button onClick={onNewTask}
              className="ml-2 px-5 py-2.5 bg-primary text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-md shadow-primary/20"
            >
              <Plus size={14} /> New Task
            </button>
          )}
        </div>
      </div>

      {/* Groups */}
      <div className="space-y-8">
        {groups.map(g => (
          <TaskGroup key={g.key} label={g.label} badge={g.badge} tasks={g.tasks} onToggle={onToggle} onEditTask={onEditTask} userRole={userRole} />
        ))}
      </div>

      {safeTasks.length === 0 && (
        <div onClick={() => isArchitect && onNewTask()}
          className={`p-20 text-center bg-surface-container-low rounded-3xl border-2 border-dashed border-outline-variant/20 transition-colors group ${isArchitect ? 'cursor-pointer hover:border-primary/30' : ''}`}
        >
          <Plus size={32} className="mx-auto text-outline/30 group-hover:text-primary/40 mb-4 transition-colors" />
          <p className="italic text-outline">Sin tareas aún. {isArchitect ? 'Haz clic para crear la primera.' : 'No tienes tareas asignadas visibles.'}</p>
        </div>
      )}

      {/* Footer insight */}
      {safeTasks.length > 0 && (
        <div className="p-10 bg-surface-container-low rounded-[40px] relative overflow-hidden group">
          <div className="relative z-10 max-w-lg">
            <h4 className="text-2xl font-headline font-extrabold text-primary leading-tight mb-2 italic">
              La precisión temporal define la excelencia en ejecución.
            </h4>
            <p className="text-sm text-outline leading-relaxed">
              <strong>{totalPending}</strong> tareas activas en{' '}
              <strong>{new Set(safeTasks.map(t => t.projectId)).size}</strong> proyectos con{' '}
              <strong>{new Set(safeTasks.map(t => t.specialist)).size}</strong> especialistas.
            </p>
          </div>
          <div className="absolute right-10 bottom-[-20px] opacity-10 group-hover:rotate-12 transition-transform">
             {isArchitect ? <Shield size={160} /> : <UserIcon size={160} />}
          </div>
        </div>
      )}
    </div>
  );
};

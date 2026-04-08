import React, { useState, useEffect } from 'react';
import { X, Plus, Target, Calendar, Trash2, CheckCircle2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Task } from './TasksView';
import type { Project } from '../utils/excel';
import type { Specialist } from '../types/settings';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (task: Task) => void;
  onDelete?: (id: string) => void;
  projects: Project[];
  specialists: Specialist[];
  editTask?: Task | null;
}

const priorityOptions = ['Critical', 'High', 'Standard', 'Low'] as const;

export const TaskModal = ({ isOpen, onClose, onAdd, onDelete, projects, specialists, editTask }: TaskModalProps) => {
  const today = new Date().toISOString().split('T')[0];
  
  // Extract unique clients
  const uniqueClients = Array.from(new Set(projects.map(p => p.client))).sort();
  
  const defaultClient = uniqueClients.length > 0 ? uniqueClients[0] : '';
  const filteredByDefaultClient = projects.filter(p => p.client === defaultClient);
  const defaultProjectId = filteredByDefaultClient.length > 0 ? filteredByDefaultClient[0].id : (projects.length > 0 ? projects[0].id : '');
  const defaultSpecialist = specialists.length > 0 ? specialists[0].name : '';

  const [form, setForm] = useState({
    description: '',
    client: defaultClient,
    projectId: defaultProjectId,
    specialist: defaultSpecialist,
    priority: 'Standard' as Task['priority'],
    dueDate: today,
    status: 'Pending' as Task['status'],
  });

  useEffect(() => {
    if (isOpen) {
      const taskProject = projects.find(p => p.id === editTask?.projectId);
      const initialClient = taskProject?.client || defaultClient;
      const initialProjectId = editTask?.projectId || (projects.find(p => p.client === initialClient)?.id || defaultProjectId);

      setForm({
        description: editTask?.description || '',
        client: initialClient,
        projectId: initialProjectId,
        specialist: editTask?.specialist || defaultSpecialist,
        priority: (editTask?.priority || 'Standard') as Task['priority'],
        dueDate: editTask?.dueDate ? editTask.dueDate.split('T')[0] : today,
        status: editTask?.status || 'Pending',
      });
    }
  }, [isOpen, editTask?.id, defaultProjectId, defaultSpecialist, defaultClient]);

  const filteredProjects = projects.filter(p => p.client === form.client);

  const handleClientChange = (client: string) => {
    const firstProjectForClient = projects.find(p => p.client === client);
    setForm({
      ...form,
      client,
      projectId: firstProjectForClient ? firstProjectForClient.id : ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const currentProject = projects.find(p => p.id === form.projectId) || filteredProjects[0];
    const task: Task = {
      id: editTask?.id || `t-${Date.now()}`,
      projectId: form.projectId || currentProject?.id || '',
      projectName: currentProject?.title || 'Unknown Project',
      specialist: form.specialist,
      description: form.description,
      dueDate: form.dueDate ? new Date(form.dueDate + 'T12:00:00').toISOString() : new Date().toISOString(),
      createdAt: editTask?.createdAt || new Date().toISOString(),
      priority: form.priority,
      status: form.status,
    };
    onAdd(task);
    onClose();
  };

  const priorityColors: Record<string, string> = {
    Critical: 'bg-error text-white',
    High: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
    Standard: 'bg-primary text-white',
    Low: 'bg-surface-container-high text-outline',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-on-background/40 backdrop-blur-md"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-surface w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-8 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-low/50 sticky top-0 z-10 backdrop-blur-sm">
              <div>
                <h3 className="text-2xl font-headline font-extrabold text-primary tracking-tight">
                  {editTask ? 'Edit Task' : 'New Task Assignment'}
                </h3>
                <p className="text-xs text-outline font-bold uppercase tracking-widest mt-1">Multi-Specialist Coordination</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-surface-container-high rounded-full transition-colors text-outline">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto">
              {/* Task Description */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-outline uppercase tracking-widest ml-1">Task Description</label>
                <div className="flex items-center gap-3 bg-surface-container-low p-4 rounded-2xl focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                  <Target size={18} className="text-primary shrink-0" />
                  <input
                    required
                    className="bg-transparent border-none focus:ring-0 text-sm font-bold w-full placeholder:text-outline/30 text-on-surface"
                    placeholder="e.g. Review Structural Blueprints v2"
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                  />
                </div>
              </div>

              {/* Status Selector (Only when editing) */}
              {editTask && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-widest ml-1">Task Status</label>
                  <div className="grid grid-cols-2 gap-3 p-1.5 bg-surface-container-low rounded-2xl border border-outline-variant/5">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, status: 'Pending' })}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-bold transition-all ${
                        form.status === 'Pending'
                          ? 'bg-primary text-white shadow-lg'
                          : 'text-outline hover:bg-primary/5'
                      }`}
                    >
                      <Clock size={14} /> In Progress
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, status: 'Completed' })}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-bold transition-all ${
                        form.status === 'Completed'
                          ? 'bg-secondary text-white shadow-lg'
                          : 'text-outline hover:bg-secondary/5'
                      }`}
                    >
                      <CheckCircle2 size={14} /> Completed
                    </button>
                  </div>
                </div>
              )}

              {/* Client & Project row */}
              <div className="space-y-4">
                {/* Client Selection */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-widest ml-1">Client</label>
                  <div className="relative bg-surface-container-low rounded-2xl focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                    <select
                      required
                      className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold p-4 pr-10 appearance-none cursor-pointer text-on-surface"
                      value={form.client}
                      onChange={e => handleClientChange(e.target.value)}
                    >
                      {uniqueClients.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none">▾</div>
                  </div>
                </div>

                {/* Project Selection */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-widest ml-1">Associated Project</label>
                  <div className="relative bg-surface-container-low rounded-2xl focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                    <select
                      required
                      className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold p-4 pr-10 appearance-none cursor-pointer text-on-surface"
                      value={form.projectId}
                      onChange={e => setForm({ ...form, projectId: e.target.value })}
                    >
                      {filteredProjects.map(p => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                      ))}
                      {filteredProjects.length === 0 && (
                        <option value="" disabled>No projects found</option>
                      )}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none">▾</div>
                  </div>
                </div>
              </div>

              {/* Specialist & Due Date row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-widest ml-1">Specialist (EP)</label>
                  <div className="relative bg-surface-container-low rounded-2xl focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                    <select
                      className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold p-4 pr-10 appearance-none cursor-pointer text-on-surface"
                      value={form.specialist}
                      onChange={e => setForm({ ...form, specialist: e.target.value })}
                    >
                      {specialists.map(s => (
                        <option key={s.id} value={s.name}>{s.name} ({s.initials})</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none">▾</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-widest ml-1">Due Date</label>
                  <div className="flex items-center gap-3 bg-surface-container-low p-4 rounded-2xl focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                    <Calendar size={16} className="text-primary shrink-0" />
                    <input
                      type="date"
                      required
                      className="bg-transparent border-none focus:ring-0 text-sm font-bold w-full text-on-surface"
                      value={form.dueDate}
                      onChange={e => setForm({ ...form, dueDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Priority level */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-outline uppercase tracking-widest ml-1">Priority Level</label>
                <div className="grid grid-cols-4 gap-2">
                  {priorityOptions.map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setForm({ ...form, priority: p })}
                      className={`py-3 rounded-xl text-[10px] font-bold transition-all border-2 ${
                        form.priority === p
                          ? `${priorityColors[p]} border-transparent scale-105 shadow-md`
                          : 'bg-surface-container-low text-outline border-transparent hover:bg-surface-container-high'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4 sticky bottom-0 bg-surface pb-4">
                {editTask && onDelete && (
                  <button
                    type="button"
                    onClick={() => {
                        if (confirm('¿Estás seguro de que deseas eliminar esta tarea?')) {
                            onDelete(editTask.id);
                            onClose();
                        }
                    }}
                    className="px-6 bg-error/10 text-error hover:bg-error/20 rounded-3xl transition-all duration-300 flex items-center justify-center group"
                    title="Eliminar Tarea"
                  >
                    <Trash2 size={20} className="group-hover:scale-110 transition-transform" />
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 bg-primary text-white py-5 rounded-3xl font-headline font-extrabold text-base shadow-xl shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                >
                  {editTask ? 'Update Assignment' : <><Plus size={20} /> Assign Task</>}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

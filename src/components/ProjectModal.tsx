import React, { useState, useEffect } from 'react';
import { X, Plus, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Project } from '../utils/excel';
import type { Client, Specialist } from '../types/settings';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (project: Project) => void;
  clients: Client[];
  specialists: Specialist[];
}

const statusOptions = ['Por iniciar', 'Iniciado', 'En proceso', 'Detenido', 'Entregado', 'Terminado', 'Ganado'];

export const ProjectModal = ({ isOpen, onClose, onAdd, clients, specialists }: ProjectModalProps) => {
  const [formData, setFormData] = useState({
    title: '',
    client: '',
    solutionsArchitect: '',
    projectLeader: '',
    salesperson: '',
    progress: 0,
    status: 'On Track' as const,
    stage: 'Architecture' as const,
    lifecycleStatus: 'Por iniciar' as any,
    startDate: new Date().toISOString().split('T')[0],
    deliveryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  useEffect(() => {
    if (isOpen) {
      const updates: any = {};
      if (clients.length > 0 && !formData.client) updates.client = clients[0].name;
      if (specialists.length > 0) {
        if (!formData.solutionsArchitect) updates.solutionsArchitect = specialists[0].name;
        if (!formData.projectLeader) updates.projectLeader = specialists[0].name;
        if (!formData.salesperson) updates.salesperson = specialists[0].name;
      }
      if (Object.keys(updates).length > 0) setFormData(prev => ({ ...prev, ...updates }));
    }
  }, [isOpen, clients, specialists]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sa = specialists.find(s => s.name === formData.solutionsArchitect);
    const initials = sa ? sa.initials : formData.solutionsArchitect.split(' ').map(n => n[0]).join('').toUpperCase();
    
    onAdd({
      ...formData,
      id: Math.random().toString(36).substr(2, 9),
      initials,
      createdAt: new Date().toISOString(),
      img: `https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=200&h=200&auto=format&fit=crop`
    });
    onClose();
    const today = new Date().toISOString().split('T')[0];
    const monthLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setFormData({ 
      title: '', 
      client: clients[0]?.name || '', 
      solutionsArchitect: specialists[0]?.name || '', 
      projectLeader: specialists[0]?.name || '', 
      salesperson: specialists[0]?.name || '', 
      progress: 0, 
      status: 'On Track', 
      stage: 'Architecture', 
      lifecycleStatus: 'Por iniciar',
      startDate: today,
      deliveryDate: monthLater
    });
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
            className="relative bg-surface w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col border border-outline-variant/10"
          >
            <div className="p-8 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-low/50">
              <h3 className="text-2xl font-headline font-extrabold text-primary tracking-tight">New Orchestration</h3>
              <button onClick={onClose} className="p-2 hover:bg-surface-container-high rounded-full transition-colors text-outline">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto max-h-[80vh]">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-widest ml-1">Project Identifier</label>
                  <div className="flex items-center gap-3 bg-surface-container-low p-4 rounded-2xl focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                    <Target size={18} className="text-primary" />
                    <input 
                      required
                      className="bg-transparent border-none focus:ring-0 text-sm font-bold w-full placeholder:text-outline/30"
                      placeholder="e.g. Neo-Vantage Office Hub"
                      value={formData.title}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-outline uppercase tracking-widest ml-1">Client Entity</label>
                    <div className="relative bg-surface-container-low rounded-2xl focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                      <select 
                        required
                        className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold p-4 pr-10 appearance-none cursor-pointer text-on-surface"
                        value={formData.client}
                        onChange={e => setFormData({...formData, client: e.target.value})}
                      >
                        {clients.length === 0 ? (
                           <option value="">No clients defined</option>
                        ) : (
                           clients.map(c => (
                             <option key={c.id} value={c.name}>{c.name} ({c.industry || 'General'})</option>
                           ))
                        )}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none">▾</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-outline uppercase tracking-widest ml-1">Solutions Architect</label>
                    <div className="relative bg-surface-container-low rounded-2xl focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                      <select 
                        required
                        className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold p-4 pr-10 appearance-none cursor-pointer text-on-surface"
                        value={formData.solutionsArchitect}
                        onChange={e => setFormData({...formData, solutionsArchitect: e.target.value})}
                      >
                        {specialists.map(s => (
                          <option key={s.id} value={s.name}>{s.name} ({s.role})</option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none">▾</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-outline uppercase tracking-widest ml-1">Líder del Proyecto</label>
                    <div className="relative bg-surface-container-low rounded-2xl focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                      <select 
                        required
                        className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold p-4 pr-10 appearance-none cursor-pointer text-on-surface"
                        value={formData.projectLeader}
                        onChange={e => setFormData({...formData, projectLeader: e.target.value})}
                      >
                        {specialists.map(s => (
                          <option key={s.id} value={s.name}>{s.name} ({s.role})</option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none">▾</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-outline uppercase tracking-widest ml-1">Vendedor (Salesperson)</label>
                    <div className="relative bg-surface-container-low rounded-2xl focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                      <select 
                        required
                        className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold p-4 pr-10 appearance-none cursor-pointer text-on-surface"
                        value={formData.salesperson}
                        onChange={e => setFormData({...formData, salesperson: e.target.value})}
                      >
                        {specialists.map(s => (
                          <option key={s.id} value={s.name}>{s.name} ({s.role})</option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none">▾</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-outline uppercase tracking-widest ml-1">Start Date</label>
                    <div className="flex items-center gap-3 bg-surface-container-low p-4 rounded-2xl">
                      <input 
                        type="date"
                        required
                        className="bg-transparent border-none focus:ring-0 text-sm font-bold w-full text-on-surface"
                        value={formData.startDate}
                        onChange={e => setFormData({...formData, startDate: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-outline uppercase tracking-widest ml-1">Delivery Date</label>
                    <div className="flex items-center gap-3 bg-surface-container-low p-4 rounded-2xl">
                      <input 
                        type="date"
                        required
                        className="bg-transparent border-none focus:ring-0 text-sm font-bold w-full text-on-surface"
                        value={formData.deliveryDate}
                        onChange={e => setFormData({...formData, deliveryDate: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-widest ml-1">Initial Lifecycle Phase</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {statusOptions.map((status) => (
                      <button 
                        key={status}
                        type="button"
                        onClick={() => setFormData({...formData, lifecycleStatus: status})}
                        className={`px-2 py-3 rounded-xl text-[9px] font-bold transition-all border-2 ${
                          formData.lifecycleStatus === status 
                            ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' 
                            : 'bg-surface-container-low text-outline border-transparent hover:bg-surface-container-high'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full primary-gradient text-white py-5 rounded-3xl font-headline font-extrabold text-base shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all mt-4 flex items-center justify-center gap-3"
              >
                <Plus size={20} />
                Initialize Project
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

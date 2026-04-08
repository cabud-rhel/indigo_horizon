import { useState, useEffect } from 'react';
import { Users, Building2, Settings2, Plus, Trash2, Download, Upload, Check, AlertCircle, Save, X, Pencil, User, Briefcase, Factory, Shield, Database, Cloud, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Specialist, Client, SystemConfig, AppBackup, UserRole } from '../types/settings';
import type { Project } from '../utils/excel';
import type { Task } from './TasksView';

interface SettingsViewProps {
  specialists: Specialist[];
  clients: Client[];
  config: SystemConfig;
  projects: Project[];
  tasks: Task[];
  userRole: UserRole;
  onUpdateSpecialists: (s: Specialist[]) => void;
  onUpdateClients: (c: Client[]) => void;
  onUpdateConfig: (conf: SystemConfig) => void;
  onRestore: (backup: Partial<AppBackup>) => void;
  syncStatus: 'idle' | 'syncing' | 'error' | 'success';
}

export const SettingsView = ({
  specialists,
  clients,
  config,
  projects,
  tasks,
  userRole,
  onUpdateSpecialists,
  onUpdateClients,
  onUpdateConfig,
  onRestore,
  syncStatus
}: SettingsViewProps) => {
  const [activeTab, setActiveTab] = useState<'specialists' | 'clients' | 'system'>('specialists');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const isArchitect = userRole === 'Architect';
  
  // Modal states
  const [isSpecModalOpen, setIsSpecModalOpen] = useState(false);
  const [editingSpec, setEditingSpec] = useState<Specialist | null>(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleExport = () => {
    const backup: AppBackup = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      projects,
      tasks,
      specialists,
      clients,
      config
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `indigo_horizon_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    showSuccess('Backup exportado con éxito');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isArchitect) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (confirm('¿Estás seguro de que deseas restaurar este backup? Se sobrescribirán todos los datos actuales.')) {
          onRestore(data);
          showSuccess('Configuración restaurada');
        }
      } catch (err) {
        alert('Error al importar el archivo. Formato inválido.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSaveSpec = (spec: { name: string, role: string, initials: string }) => {
    if (!isArchitect) return;
    if (editingSpec) {
      onUpdateSpecialists(specialists.map(s => s.id === editingSpec.id ? { ...s, ...spec } : s));
      showSuccess('Especialista actualizado');
    } else {
      onUpdateSpecialists([...specialists, {
        id: Math.random().toString(36).substr(2, 9),
        ...spec,
        active: true
      }]);
      showSuccess('Especialista añadido');
    }
    setIsSpecModalOpen(false);
    setEditingSpec(null);
  };

  const handleSaveClient = (client: { name: string, industry: string }) => {
    if (!isArchitect) return;
    if (editingClient) {
      onUpdateClients(clients.map(c => c.id === editingClient.id ? { ...c, ...client } : c));
      showSuccess('Cliente actualizado');
    } else {
      onUpdateClients([...clients, {
        id: Math.random().toString(36).substr(2, 9),
        ...client,
        active: true
      }]);
      showSuccess('Cliente añadido');
    }
    setIsClientModalOpen(false);
    setEditingClient(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-4xl font-headline font-extrabold text-primary tracking-tight">Configuración</h2>
          <p className="text-xs font-bold text-outline uppercase tracking-widest mt-2 flex items-center gap-2">
            <Shield size={14} className={isArchitect ? 'text-primary' : 'text-secondary'} /> 
            {isArchitect ? 'Gestión maestra del ecosistema Architect Solutions' : 'Vista de consulta de parámetros de red'}
          </p>
        </div>
        <AnimatePresence>
            {successMsg && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                    className="bg-secondary/10 text-secondary px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-secondary/20 flex items-center gap-2"
                >
                    <Check size={14} /> {successMsg}
                </motion.div>
            )}
        </AnimatePresence>
      </div>

      <div className="flex gap-1 p-1 bg-surface-container-low rounded-2xl w-fit border border-outline-variant/10">
        <TabBtn active={activeTab === 'specialists'} onClick={() => setActiveTab('specialists')} icon={<Users size={16} />} label="Especialistas" />
        <TabBtn active={activeTab === 'clients'} onClick={() => setActiveTab('clients')} icon={<Building2 size={16} />} label="Clientes" />
        <TabBtn active={activeTab === 'system'} onClick={() => setActiveTab('system')} icon={<Settings2 size={16} />} label="Sistema" />
      </div>

      <div className="min-h-[500px]">
        <AnimatePresence mode="wait">
          {activeTab === 'specialists' && (
            <motion.div key="spec" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-black text-primary uppercase tracking-widest">Directorio de Especialistas (EP)</h3>
                {isArchitect && (
                  <button 
                    onClick={() => { setEditingSpec(null); setIsSpecModalOpen(true); }}
                    className="bg-primary text-white px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
                  ><Plus size={16} /> Nuevo Especialista</button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {specialists.map(s => (
                  <div key={s.id} className="p-6 bg-surface-container-low rounded-3xl border border-outline-variant/10 group hover:border-primary/30 transition-all flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center font-headline font-black text-lg border border-primary/10">{s.initials}</div>
                      <div>
                        <p className="font-bold text-primary">{s.name}</p>
                        <p className="text-[10px] text-outline font-bold uppercase tracking-widest">{s.role}</p>
                      </div>
                    </div>
                    {isArchitect && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={() => { setEditingSpec(s); setIsSpecModalOpen(true); }}
                          className="p-3 text-outline hover:text-primary hover:bg-primary/5 rounded-2xl transition-all"
                        ><Pencil size={18} /></button>
                        <button 
                          onClick={() => { if (confirm('¿Eliminar especialista?')) onUpdateSpecialists(specialists.filter(sp => sp.id !== s.id)); }} 
                          className="p-3 text-outline hover:text-error hover:bg-error/5 rounded-2xl transition-all"
                        ><Trash2 size={18} /></button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'clients' && (
            <motion.div key="clients" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-black text-primary uppercase tracking-widest">Gestión de Clientes Activos</h3>
                {isArchitect && (
                  <button 
                    onClick={() => { setEditingClient(null); setIsClientModalOpen(true); }}
                    className="bg-primary text-white px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
                  ><Plus size={16} /> Nuevo Cliente</button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {clients.map(c => (
                  <div key={c.id} className="p-6 bg-surface-container-low rounded-3xl border border-outline-variant/10 group hover:border-primary/30 transition-all flex items-center justify-between shadow-sm">
                    <div className="flex-1">
                      <p className="font-bold text-primary">{c.name}</p>
                      <p className="text-[10px] text-outline font-bold uppercase tracking-widest">{c.industry}</p>
                    </div>
                    {isArchitect && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={() => { setEditingClient(c); setIsClientModalOpen(true); }}
                          className="p-3 text-outline hover:text-primary hover:bg-primary/5 rounded-2xl transition-all"
                        ><Pencil size={18} /></button>
                        <button 
                          onClick={() => { if (confirm('¿Eliminar cliente?')) onUpdateClients(clients.filter(cl => cl.id !== c.id)); }}
                          className="p-3 text-outline hover:text-error hover:bg-error/5 rounded-2xl transition-all"
                        ><Trash2 size={18} /></button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'system' && (
            <motion.div key="sys" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Local Backup */}
                <div className={`bg-primary/5 rounded-[40px] p-10 border border-primary/20 space-y-8 ${!isArchitect ? 'opacity-60 cursor-not-allowed' : ''}`}>
                  <div className="flex items-start gap-5">
                      <div className="p-4 bg-primary/10 rounded-2xl text-primary"><Download size={32} /></div>
                      <div>
                          <h4 className="text-xl font-headline font-extrabold text-primary">Seguridad y Respaldo</h4>
                          <p className="text-sm text-outline font-medium mt-1">Exporta toda la configuración a un archivo local.</p>
                      </div>
                  </div>
                  <div className="flex gap-4">
                      <button onClick={handleExport}
                          className="flex-1 py-4 bg-primary text-white rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.02] transition-all shadow-xl shadow-primary/20"
                      >
                          <Save size={18} /> Exportar
                      </button>
                      {isArchitect && (
                        <label className="flex-1 cursor-pointer">
                            <div className="w-full h-full py-4 bg-surface rounded-2xl text-primary border-2 border-dashed border-primary/30 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-primary/5 transition-all">
                                <Upload size={18} /> Importar
                            </div>
                            <input type="file" className="hidden" accept=".json" onChange={handleImport} />
                        </label>
                      )}
                  </div>
                </div>

                {/* Cloud Sync */}
                <div className={`bg-secondary/5 rounded-[40px] p-10 border border-secondary/20 space-y-6 ${!isArchitect ? 'opacity-60 cursor-not-allowed' : ''}`}>
                  <div className="flex items-start justify-between gap-5">
                      <div className="flex items-start gap-5">
                        <div className="p-4 bg-secondary/10 rounded-2xl text-secondary"><Database size={32} /></div>
                        <div>
                            <h4 className="text-xl font-headline font-extrabold text-secondary">Sincronización Cloud</h4>
                            <p className="text-sm text-outline font-medium mt-1">Conecta con tu repositorio de GitHub para persistencia automática.</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                          syncStatus === 'success' ? 'bg-secondary/20 text-secondary' : 
                          syncStatus === 'error' ? 'bg-error/20 text-error' : 'bg-outline-variant/20 text-outline'
                        }`}>
                          {syncStatus === 'success' ? 'Conectado' : syncStatus === 'error' ? 'Error' : 'Offline'}
                        </div>
                      </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <InputGroup 
                        label="Usuario GitHub" 
                        value={config.githubOwner || ''} 
                        onChange={v => onUpdateConfig({ ...config, githubOwner: v })} 
                        placeholder="e.g. cabud-rhel" 
                      />
                      <InputGroup 
                        label="Repositorio" 
                        value={config.githubRepo || ''} 
                        onChange={v => onUpdateConfig({ ...config, githubRepo: v })} 
                        placeholder="indigo_horizon" 
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-end ml-1">
                        <label className="text-[10px] font-bold text-outline uppercase tracking-widest">Personal Access Token (PAT)</label>
                        <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noreferrer" className="text-[9px] font-bold text-secondary hover:underline">Generar uno nuevo</a>
                      </div>
                      <div className="flex items-center gap-3 bg-white/50 p-4 rounded-2xl border border-secondary/10">
                        <Database size={18} className="text-secondary" />
                        <input 
                          type="password"
                          className="bg-transparent border-none focus:ring-0 text-sm font-bold w-full placeholder:text-outline/30 text-on-surface"
                          placeholder="github_pat_..."
                          value={config.githubToken || ''}
                          onChange={e => onUpdateConfig({ ...config, githubToken: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button 
                         onClick={() => {
                           // Trigger a reload of the app or a manual save to test
                           window.location.reload();
                         }}
                         className="flex-1 py-3 bg-secondary/10 text-secondary rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-secondary/20 transition-all flex items-center justify-center gap-2"
                      >
                         <RefreshCw size={14} /> Probar y Recargar
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-secondary/5 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <Cloud size={20} className="text-secondary" />
                        <span className="text-xs font-bold text-primary italic">Autosync Inteligente</span>
                      </div>
                      <button 
                        disabled={!isArchitect}
                        onClick={() => onUpdateConfig({ ...config, autoSync: !config.autoSync })}
                        className={`w-12 h-6 rounded-full transition-all relative ${config.autoSync ? 'bg-secondary' : 'bg-outline-variant'}`}
                      >
                        <motion.div animate={{ x: config.autoSync ? 24 : 4 }} className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                      </button>
                    </div>

                    {syncStatus === 'error' && (
                      <div className="p-4 bg-error/5 border border-error/20 rounded-2xl flex items-start gap-3">
                        <AlertCircle size={16} className="text-error shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="text-[11px] font-bold text-error leading-tight">Error de Sincronización</p>
                          <p className="text-[10px] text-error/70 leading-tight">Verifica que el Token sea válido y tenga permisos de 'Contents: Read & Write' para este repositorio privado.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-surface-container-low p-8 rounded-[40px] border border-outline-variant/10 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <AlertCircle size={20} className="text-secondary" />
                            <h4 className="font-bold text-primary">Alertas Predictivas</h4>
                        </div>
                        <button 
                            disabled={!isArchitect}
                            onClick={() => onUpdateConfig({ ...config, predictiveAlerts: !config.predictiveAlerts })}
                            className={`w-14 h-8 rounded-full transition-all relative ${config.predictiveAlerts ? 'bg-secondary' : 'bg-outline-variant'} disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            <motion.div animate={{ x: config.predictiveAlerts ? 28 : 4 }} className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md" />
                        </button>
                    </div>
                    <p className="text-xs text-outline leading-relaxed">Habilita el cálculo algorítmico del riesgo de SLA basado en las fechas.</p>
                </div>
                
                <div className="bg-surface-container-low p-8 rounded-[40px] border border-outline-variant/10 space-y-6">
                    <div className="space-y-2">
                        <h4 className="font-bold text-primary">Umbral Crítico de SLA</h4>
                        <p className="text-[10px] text-outline font-bold uppercase tracking-widest">Actual: {Math.round(config.slaThresholdAtRisk * 100)}% del tiempo transcurrido</p>
                    </div>
                    <input type="range" min="0.5" max="0.95" step="0.05" value={config.slaThresholdAtRisk}
                        disabled={!isArchitect}
                        onChange={e => onUpdateConfig({ ...config, slaThresholdAtRisk: parseFloat(e.target.value) })}
                        className="w-full h-2 bg-outline-variant rounded-lg appearance-none cursor-pointer accent-primary disabled:opacity-50 disabled:cursor-not-allowed" 
                    />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {isArchitect && (
        <>
          <SpecialistModal 
            isOpen={isSpecModalOpen} 
            onClose={() => setIsSpecModalOpen(false)} 
            onSave={handleSaveSpec}
            data={editingSpec}
          />

          <ClientModal 
            isOpen={isClientModalOpen} 
            onClose={() => setIsClientModalOpen(false)} 
            onSave={handleSaveClient}
            data={editingClient}
          />
        </>
      )}
    </div>
  );
};

// ── Specialist Modal ──────────────────────────────────────────────────
const SpecialistModal = ({ isOpen, onClose, onSave, data }: { isOpen: boolean, onClose: () => void, onSave: (s: { name: string, role: string, initials: string }) => void, data: Specialist | null }) => {
  const [formData, setFormData] = useState({ name: '', role: '', initials: '' });

  useEffect(() => {
    if (isOpen) {
      setFormData(data ? { name: data.name, role: data.role, initials: data.initials } : { name: '', role: 'Consultant', initials: '' });
    }
  }, [isOpen, data]);

  const handleNameChange = (name: string) => {
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().substr(0, 3);
    setFormData(prev => ({ ...prev, name, initials }));
  };

  return (
    <ManagementModal isOpen={isOpen} onClose={onClose} title={data ? 'Editar Especialista' : 'Nuevo Especialista'}>
      <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-6">
        <div className="space-y-4">
          <InputGroup label="Nombre Completo" icon={<User size={18} />} value={formData.name} onChange={handleNameChange} placeholder="e.g. Elena Portales" />
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
               <InputGroup label="Cargo / Rol" icon={<Briefcase size={18} />} value={formData.role} onChange={v => setFormData({ ...formData, role: v })} placeholder="e.g. Senior Solutions Architect" />
            </div>
            <InputGroup label="Iniciales" value={formData.initials} onChange={v => setFormData({ ...formData, initials: v.toUpperCase() })} placeholder="EP" />
          </div>
        </div>
        <button type="submit" className="w-full bg-primary text-white py-4 rounded-2xl font-bold uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
          {data ? 'Actualizar Especialista' : 'Añadir al Directorio'}
        </button>
      </form>
    </ManagementModal>
  );
};

// ── Client Modal ──────────────────────────────────────────────────────
const ClientModal = ({ isOpen, onClose, onSave, data }: { isOpen: boolean, onClose: () => void, onSave: (c: { name: string, industry: string }) => void, data: Client | null }) => {
  const [formData, setFormData] = useState({ name: '', industry: '' });

  useEffect(() => {
    if (isOpen) {
      setFormData(data ? { name: data.name, industry: data.industry } : { name: '', industry: '' });
    }
  }, [isOpen, data]);

  return (
    <ManagementModal isOpen={isOpen} onClose={onClose} title={data ? 'Editar Cliente' : 'Nuevo Cliente'}>
      <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-6">
        <div className="space-y-4">
          <InputGroup label="Nombre de la Entidad" icon={<Building2 size={18} />} value={formData.name} onChange={v => setFormData({ ...formData, name: v })} placeholder="e.g. TechNova Solutions" />
          <InputGroup label="Industria / Sector" icon={<Factory size={18} />} value={formData.industry} onChange={v => setFormData({ ...formData, industry: v })} placeholder="e.g. Technology" />
        </div>
        <button type="submit" className="w-full bg-primary text-white py-4 rounded-2xl font-bold uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
          {data ? 'Actualizar Cliente' : 'Registrar Cliente'}
        </button>
      </form>
    </ManagementModal>
  );
};

// ── Shared UI Components ───────────────────────────────────────────────
const ManagementModal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: any }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-on-background/40 backdrop-blur-md" />
        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative bg-surface w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden border border-outline-variant/10"
        >
          <div className="p-8 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-low/50">
            <h3 className="text-xl font-headline font-extrabold text-primary tracking-tight">{title}</h3>
            <button onClick={onClose} className="p-2 hover:bg-surface-container-high rounded-full transition-colors text-outline"><X size={24} /></button>
          </div>
          <div className="p-8">{children}</div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const InputGroup = ({ label, icon, value, onChange, placeholder }: { label: string, icon?: React.ReactNode, value: string, onChange: (v: string) => void, placeholder: string }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-bold text-outline uppercase tracking-widest ml-1">{label}</label>
    <div className="flex items-center gap-3 bg-surface-container-low p-4 rounded-2xl focus-within:ring-2 focus-within:ring-primary/20 transition-all">
      {icon && <div className="text-primary">{icon}</div>}
      <input 
        required
        className="bg-transparent border-none focus:ring-0 text-sm font-bold w-full placeholder:text-outline/30 text-on-surface"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  </div>
);

const TabBtn = ({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) => (
  <button onClick={onClick}
    className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${
      active ? 'bg-surface text-primary shadow-sm shadow-black/5' : 'text-outline hover:text-primary hover:bg-surface/50'
    }`}
  >
    {icon} {label}
  </button>
);

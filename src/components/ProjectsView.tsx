import { useState } from 'react';
import { LayoutGrid, List, ArrowUpRight, Search, Activity, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Project } from '../utils/excel';

interface ProjectsViewProps {
  projects: Project[];
  onProjectClick: (project: Project) => void;
}

const lifecycleStages = ['All', 'Tendering', 'Architecture', 'Technical Review', 'Delivery'];

export const ProjectsView = ({ projects, onProjectClick }: ProjectsViewProps) => {
  const [activeStage, setActiveStage] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filtered = projects.filter(p => {
    const matchesStage = activeStage === 'All' || p.stage === activeStage;
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (p.client && p.client.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStage && matchesSearch;
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-headline font-extrabold text-primary tracking-tight">Project Portfolio</h2>
          <p className="text-xs font-bold text-outline uppercase tracking-widest mt-1">Lifecycle Orchestration</p>
        </div>
        <div className="flex bg-surface-container-low p-1.5 rounded-2xl gap-1 overflow-x-auto custom-scrollbar no-scrollbar whitespace-nowrap">
          {lifecycleStages.map(stage => (
            <button 
              key={stage}
              onClick={() => setActiveStage(stage)}
              className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                activeStage === stage ? 'bg-primary text-white shadow-md' : 'text-outline hover:text-primary hover:bg-surface-container-high'
              }`}
            >
              {stage}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4 bg-surface-container-low px-6 py-4 rounded-3xl group focus-within:ring-2 focus-within:ring-primary/10 transition-all shadow-sm border border-outline-variant/10">
        <Search className="text-outline/60" size={20} />
        <input 
          type="text" 
          placeholder="Filtrar portafolio por título o cliente..." 
          className="bg-transparent border-none focus:ring-0 text-sm font-semibold w-full text-on-surface placeholder:text-outline/30"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="flex items-center gap-2 border-l border-outline-variant/20 pl-4 h-8">
          <button 
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-primary text-white shadow-lg' : 'text-outline/60 hover:bg-surface-container-high'}`}
          >
            <LayoutGrid size={18} />
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-primary text-white shadow-lg' : 'text-outline/60 hover:bg-surface-container-high'}`}
          >
            <List size={18} />
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === 'grid' ? (
          <motion.div 
            key="grid"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {filtered.map((project) => (
              <ProjectCard key={project.id} project={project} onClick={() => onProjectClick(project)} />
            ))}
          </motion.div>
        ) : (
          <motion.div 
            key="list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="bg-surface-container-lowest px-8 py-4 rounded-full border border-outline-variant/10 hidden lg:grid grid-cols-12 gap-4 items-center text-[10px] font-black text-outline uppercase tracking-[0.15em]">
              <div className="col-span-1">Preview</div>
              <div className="col-span-3">Proyecto / Cliente</div>
              <div className="col-span-2">Etapa</div>
              <div className="col-span-3">Progreso</div>
              <div className="col-span-2">Líder / Arquitecto</div>
              <div className="col-span-1 text-right">Estatus</div>
            </div>
            {filtered.map((project) => (
              <ProjectRow key={project.id} project={project} onClick={() => onProjectClick(project)} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {filtered.length === 0 && (
        <div className="p-20 text-center bg-surface-container-low rounded-[40px] border-2 border-dashed border-outline-variant/10 italic text-outline/60 flex flex-col items-center">
          <div className="w-16 h-16 bg-surface-container-high rounded-3xl flex items-center justify-center mb-4 text-outline/20">
             <Activity size={32} />
          </div>
          <p className="font-headline font-bold text-lg mb-1">No se encontraron arquitecturas</p>
          <p className="text-xs uppercase tracking-widest font-black">Refine los criterios de filtrado</p>
        </div>
      )}
    </div>
  );
};

const ProjectCard = ({ project, onClick }: { project: Project; onClick: () => void }) => (
  <motion.div 
    layout
    whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(0,0,0,0.08)' }}
    onClick={onClick}
    className="bg-surface-container-lowest rounded-[40px] p-7 shadow-sm cursor-pointer group hover:bg-surface-container-low transition-all duration-500 relative overflow-hidden border border-outline-variant/5"
  >
    <div className="absolute top-0 right-0 p-5 opacity-0 group-hover:opacity-100 transition-all duration-300">
      <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center shadow-xl shadow-primary/20 scale-90 group-hover:scale-100 transition-transform">
        <ArrowUpRight size={18} />
      </div>
    </div>
    
    <div className="space-y-7">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-[24px] overflow-hidden bg-surface-container-high group-hover:scale-105 transition-all duration-500 shadow-inner p-0.5">
          <img src={project.img} alt={project.title} className="w-full h-full object-cover rounded-[22px]" />
        </div>
        <div className="pt-1 flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-black text-primary/40 uppercase tracking-[0.1em]">{project.stage}</span>
          </div>
          <h3 className="font-headline font-bold text-primary group-hover:text-primary-container transition-colors leading-tight mt-0.5 text-lg truncate pr-8">
            {project.title}
          </h3>
          <p className="text-[10px] text-outline font-black uppercase tracking-tight opacity-60">Cliente: {project.client}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-end text-[10px] font-black uppercase tracking-widest text-outline">
          <span>Avance Arquitectónico</span>
          <span className="text-primary font-bold">{project.progress}%</span>
        </div>
        <div className="h-2 w-full bg-surface-container-low rounded-full overflow-hidden shadow-inner">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${project.progress}%` }}
            transition={{ duration: 1.2, ease: "circOut" }}
            className={`h-full rounded-full shadow-sm ${
              project.status === "On Track" ? "bg-secondary" : 
              project.status === "At Risk" ? "bg-tertiary-fixed-dim" : "bg-error"
            }`}
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-outline-variant/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary border border-primary/20">
            {project.initials}
          </div>
          <span className="text-[11px] font-black text-on-surface/60 uppercase tracking-tight">{project.solutionsArchitect}</span>
        </div>
        <span className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest ${
          project.status === "On Track" ? "bg-secondary-container text-on-secondary-container" : 
          project.status === "At Risk" ? "bg-tertiary-fixed text-on-tertiary-fixed-variant" : 
          "bg-error-container text-on-error-container"
        }`}>
          {project.status === 'On Track' ? 'En Tiempo' : project.status === 'At Risk' ? 'En Riesgo' : 'Vencido'}
        </span>
      </div>
    </div>
  </motion.div>
);

const ProjectRow = ({ project, onClick }: { project: Project; onClick: () => void }) => (
  <div 
    onClick={onClick}
    className="bg-surface-container-lowest lg:rounded-full rounded-2xl p-3 lg:grid grid-cols-12 gap-4 items-center cursor-pointer group hover:bg-surface-container-low transition-all duration-300 border border-outline-variant/10 hover:shadow-md"
  >
    <div className="col-span-1 hidden lg:flex items-center justify-center">
      <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-container group-hover:scale-110 transition-transform p-0.5">
        <img src={project.img} alt={project.title} className="w-full h-full object-cover rounded-full" />
      </div>
    </div>
    <div className="col-span-3 min-w-0 pr-4">
      <h4 className="font-bold text-sm text-primary truncate leading-tight">{project.title}</h4>
      <p className="text-[9px] text-outline font-black uppercase tracking-widest truncate">{project.client}</p>
    </div>
    <div className="col-span-2 hidden lg:block">
      <span className="px-3 py-1 rounded-full bg-surface-container-high text-[9px] font-black uppercase tracking-widest text-outline">
        {project.stage}
      </span>
    </div>
    <div className="col-span-3 hidden lg:block pr-6">
      <div className="flex items-center gap-3">
        <div className="h-1.5 flex-1 bg-surface-container-low rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full ${
              project.status === "On Track" ? "bg-secondary" : 
              project.status === "At Risk" ? "bg-tertiary-fixed-dim" : "bg-error"
            }`}
            style={{ width: `${project.progress}%` }}
          />
        </div>
        <span className="text-[10px] font-bold text-primary">{project.progress}%</span>
      </div>
    </div>
    <div className="col-span-2 hidden lg:flex items-center gap-2">
      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[8px] font-black text-primary">
        {project.initials}
      </div>
      <span className="text-[10px] font-bold text-outline truncate uppercase">{project.solutionsArchitect}</span>
    </div>
    <div className="col-span-1 text-right flex justify-end">
       <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest hidden lg:block ${
        project.status === "On Track" ? "bg-secondary-container text-on-secondary-container" : 
        project.status === "At Risk" ? "bg-tertiary-fixed text-on-tertiary-fixed-variant" : 
        "bg-error-container text-on-error-container"
      }`}>
        {project.status === 'On Track' ? 'OK' : project.status === 'At Risk' ? 'RISK' : 'DELAY'}
      </div>
      <ChevronRight size={18} className="text-outline/30 lg:hidden" />
    </div>
  </div>
);

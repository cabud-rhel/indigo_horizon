import { useState } from 'react';
import { ChevronRight, Filter, SortDesc, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Project } from '../utils/excel';

interface PortfolioListProps {
  projects: Project[];
  searchTerm: string;
  onProjectClick?: (project: Project) => void;
}

const STATUS_FILTERS = ['All', 'On Track', 'At Risk', 'Overdue'] as const;
type SortMode = 'default' | 'progress_desc' | 'progress_asc';

export const PortfolioList = ({ projects, searchTerm, onProjectClick }: PortfolioListProps) => {
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('default');

  // 1. Search filter
  let result = projects.filter(p =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.client && p.client.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.solutionsArchitect && p.solutionsArchitect.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // 2. Status filter
  if (statusFilter !== 'All') {
    result = result.filter(p => p.status === statusFilter);
  }

  // 3. Sort by progress
  if (sortMode === 'progress_desc') {
    result = [...result].sort((a, b) => b.progress - a.progress);
  } else if (sortMode === 'progress_asc') {
    result = [...result].sort((a, b) => a.progress - b.progress);
  }

  const cycleSortMode = () => {
    setSortMode(prev =>
      prev === 'default' ? 'progress_desc' :
      prev === 'progress_desc' ? 'progress_asc' : 'default'
    );
  };

  const sortLabel = sortMode === 'progress_desc' ? 'Progress ↓' : sortMode === 'progress_asc' ? 'Progress ↑' : 'Priority';

  const statusPillColor = (status: string) =>
    status === 'On Track' ? 'bg-secondary-container text-on-secondary-container' :
    status === 'At Risk' ? 'bg-tertiary-fixed text-on-tertiary-fixed-variant' :
    'bg-error-container text-on-error-container';

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-2xl font-headline font-extrabold text-primary tracking-tight">Active Portfolio</h3>
          {(statusFilter !== 'All' || sortMode !== 'default') && (
            <p className="text-[10px] font-bold text-primary/60 uppercase tracking-widest mt-1">
              {result.length} result{result.length !== 1 ? 's' : ''}
              {statusFilter !== 'All' ? ` · ${statusFilter}` : ''}
              {sortMode !== 'default' ? ` · ${sortLabel}` : ''}
            </p>
          )}
        </div>

        <div className="flex gap-2 items-center">
          {/* Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsFilterOpen(v => !v)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 uppercase tracking-widest border-2 ${
                statusFilter !== 'All'
                  ? 'bg-primary text-white border-primary'
                  : 'bg-surface-container-low text-primary border-transparent hover:bg-surface-container-high'
              }`}
            >
              <Filter size={14} />
              {statusFilter !== 'All' ? statusFilter : 'Filter'}
              {statusFilter !== 'All' && (
                <span
                  onClick={e => { e.stopPropagation(); setStatusFilter('All'); }}
                  className="ml-1 hover:opacity-70 cursor-pointer"
                >
                  <X size={12} />
                </span>
              )}
            </button>
            <AnimatePresence>
              {isFilterOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 bg-surface-container-high rounded-2xl shadow-2xl z-20 overflow-hidden border border-outline-variant/10 min-w-[160px]"
                >
                  {STATUS_FILTERS.map(s => (
                    <button
                      key={s}
                      onClick={() => { setStatusFilter(s); setIsFilterOpen(false); }}
                      className={`w-full px-5 py-3.5 text-left text-xs font-bold uppercase tracking-widest flex items-center justify-between gap-4 transition-colors ${
                        statusFilter === s
                          ? 'text-primary bg-primary/10'
                          : 'text-outline hover:bg-surface-container-highest/60'
                      }`}
                    >
                      {s}
                      {statusFilter === s && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sort by Progress */}
          <button
            onClick={cycleSortMode}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 uppercase tracking-widest border-2 ${
              sortMode !== 'default'
                ? 'bg-primary text-white border-primary'
                : 'bg-surface-container-low text-primary border-transparent hover:bg-surface-container-high'
            }`}
          >
            <SortDesc size={14} className={sortMode === 'progress_asc' ? 'rotate-180' : ''} />
            {sortLabel}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {result.map((project) => (
            <motion.div
              key={project.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={() => onProjectClick?.(project)}
              className="bg-surface-container-lowest p-6 rounded-3xl group hover:bg-surface-container-low transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-surface-container border-2 border-surface-container-high flex-shrink-0">
                    <img src={project.img} alt={project.title} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="font-headline font-bold text-primary group-hover:text-primary-container transition-colors">
                      {project.title}
                    </h4>
                    <p className="text-xs text-outline font-medium tracking-tight">Client: {project.client}</p>
                  </div>
                </div>

                <div className="hidden md:block">
                  <p className="text-[10px] uppercase font-bold text-outline tracking-wider mb-2">Assigned Architect</p>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-surface-container-high flex items-center justify-center text-[10px] font-bold text-primary border border-surface-container-highest">
                      {project.initials}
                    </div>
                    <span className="text-xs font-bold text-on-surface/80">{project.solutionsArchitect}</span>
                  </div>
                </div>

                <div className="w-32 hidden sm:block">
                  <p className="text-[10px] uppercase font-bold text-outline tracking-wider mb-3">Progress</p>
                  <div className="h-1.5 w-full bg-surface-container-low rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${project.progress}%` }}
                      transition={{ duration: 1 }}
                      className={`h-full rounded-full ${
                        project.status === 'On Track' ? 'bg-secondary' :
                        project.status === 'At Risk' ? 'bg-tertiary-fixed-dim' : 'bg-error'
                      }`}
                    />
                  </div>
                </div>

                <div className="min-w-[100px] flex justify-end">
                  <span className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest ${statusPillColor(project.status)}`}>
                    {project.status}
                  </span>
                </div>

                <button className="p-2 rounded-full text-outline hover:text-primary transition-colors group-hover:translate-x-1 duration-300">
                  <ChevronRight size={20} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {result.length === 0 && (
          <div className="p-12 text-center bg-surface-container-low rounded-3xl border-2 border-dashed border-outline-variant/20">
            <p className="text-outline font-bold uppercase text-xs tracking-widest">
              {searchTerm
                ? `No architectures matching "${searchTerm}"`
                : `No projects with status "${statusFilter}"`}
            </p>
            {statusFilter !== 'All' && (
              <button
                onClick={() => setStatusFilter('All')}
                className="mt-4 text-primary text-xs font-bold hover:underline"
              >
                Clear filter
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

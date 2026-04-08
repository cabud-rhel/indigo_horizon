import { Briefcase, Donut } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Project } from '../utils/excel';

interface StatHeroProps {
  projects: Project[];
}

export const StatHero = ({ projects }: StatHeroProps) => {
  const activeCount = projects.length;
  const avgProgress = projects.length > 0 
    ? Math.round(projects.reduce((acc, p) => acc + p.progress, 0) / projects.length) 
    : 0;
  
  const onTrack = projects.filter(p => p.status === "On Track").length;
  const atRisk = projects.filter(p => p.status === "At Risk").length;
  const overdue = projects.filter(p => p.status === "Overdue").length;

  const score = Math.round((onTrack * 100 + atRisk * 50) / (projects.length || 1));

  return (
    <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <motion.div 
        whileHover={{ y: -4 }}
        className="md:col-span-1 bg-surface-container-lowest p-8 rounded-3xl shadow-sm flex flex-col justify-between overflow-hidden relative group transition-all hover:bg-surface-container-low"
      >
        <div className="relative z-10">
          <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-2">Active Projects</p>
          <h2 className="text-5xl font-headline font-extrabold text-primary tracking-tighter">{activeCount}</h2>
        </div>
        <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
          <Briefcase size={120} />
        </div>
      </motion.div>

      <motion.div 
        whileHover={{ y: -4 }}
        className="md:col-span-1 bg-surface-container-lowest p-8 rounded-3xl shadow-sm flex flex-col justify-between overflow-hidden relative group transition-all hover:bg-surface-container-low"
      >
        <div className="relative z-10">
          <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-2">Avg. Completion</p>
          <h2 className="text-5xl font-headline font-extrabold text-primary tracking-tighter">{avgProgress}<span className="text-2xl text-primary/40 font-bold ml-1">%</span></h2>
        </div>
        <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
          <Donut size={120} />
        </div>
      </motion.div>

      <motion.div 
        whileHover={{ y: -4 }}
        className="md:col-span-2 bg-surface-container-lowest p-8 rounded-3xl shadow-sm flex items-center justify-between overflow-hidden relative"
      >
        <div className="space-y-4">
          <p className="text-[10px] font-bold text-outline uppercase tracking-widest">Global Portfolio Health</p>
          <div className="flex gap-8">
            <div className="flex flex-col">
              <span className="text-2xl font-headline font-extrabold text-on-secondary-container">{onTrack}</span>
              <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">On Track</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-headline font-extrabold text-on-tertiary-fixed-variant">{atRisk}</span>
              <span className="text-[10px] font-bold text-on-tertiary-fixed-variant/60 uppercase tracking-widest">At Risk</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-headline font-extrabold text-error">{overdue}</span>
              <span className="text-[10px] font-bold text-error uppercase tracking-widest">Overdue</span>
            </div>
          </div>
        </div>
        <div className="w-32 h-32 flex items-center justify-center relative">
          <svg className="w-full h-full transform -rotate-90">
            <circle className="text-surface-container" cx="64" cy="64" r="50" fill="transparent" stroke="currentColor" strokeWidth="4" />
            <motion.circle 
              animate={{ strokeDashoffset: 314 - (314 * score / 100) }}
              className="text-secondary" 
              cx="64" cy="64" r="50" fill="transparent" stroke="currentColor" strokeWidth="6" strokeDasharray="314" strokeLinecap="round" 
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[10px] font-bold text-outline uppercase">Score</span>
            <span className="text-lg font-headline font-black text-primary">{score}</span>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

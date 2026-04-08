import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { StatHero } from './components/StatHero';
import { PortfolioList } from './components/PortfolioList';
import { ActivityFeed } from './components/ActivityFeed';
import { SLATracker } from './components/SLATracker';
import { TasksView } from './components/TasksView';
import type { Task } from './components/TasksView';
import { TaskModal } from './components/TaskModal';
import { ProjectDetails } from './components/ProjectDetails';
import { ProjectsView } from './components/ProjectsView';
import { ProjectModal } from './components/ProjectModal';
import { motion } from 'framer-motion';
import { SettingsView } from './components/SettingsView';
import { exportToExcel, importFromExcel } from './utils/excel';
import type { Project } from './utils/excel';
import initialProjectsData from './data/initialProjects.json';
import slaTasksData from './data/slaTasks.json';
import initialTasksData from './data/tasks.json';
import { Plus } from 'lucide-react';
import type { Specialist, Client, SystemConfig, AppBackup, UserRole } from './types/settings';
import { commitMultipleFiles } from './utils/githubSync';

const DEFAULT_SPECIALISTS: Specialist[] = [
  { id: '1', name: 'Elena P.', role: 'Senior Architect', initials: 'EP', active: true },
  { id: '2', name: 'Mark V.', role: 'Specialist Engineer', initials: 'MV', active: true },
  { id: '3', name: 'Sophia L.', role: 'Design Lead', initials: 'SL', active: true },
  { id: '4', name: 'Carlos A.', role: 'Structural Analyst', initials: 'CA', active: true },
  { id: '5', name: 'Julian D.', role: 'BIM Coordinator', initials: 'JD', active: true },
  { id: '6', name: 'Sarah M.', role: 'MEP Specialist', initials: 'SM', active: true },
  { id: '7', name: 'Alex K.', role: 'Sustainability Expert', initials: 'AK', active: true },
  { id: '8', name: 'Ana R.', role: 'Project Consultant', initials: 'AR', active: true },
];

const DEFAULT_CLIENTS: Client[] = [
  { id: 'c1', name: 'Starlight Financial', industry: 'Finance', active: true },
  { id: 'c2', name: 'Neo-Vantage', industry: 'Logistics', active: true },
  { id: 'c3', name: 'The Serenity Residences', industry: 'Real Estate', active: true },
  { id: 'c4', name: 'Gourmet Global', industry: 'Hospitality', active: true },
  { id: 'c5', name: 'TechNova Solutions', industry: 'Technology', active: true },
];

function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [userRole, setUserRole] = useState<UserRole>('Specialist');
  const [config, setConfig] = useState<SystemConfig>({
    slaThresholdAtRisk: 0.75,
    predictiveAlerts: true,
    theme: 'light'
  });
  const [hasLoaded, setHasLoaded] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error' | 'success'>('idle');

  const isArchitect = userRole === 'Architect';

  // Load from localStorage on mount
  useEffect(() => {
    const savedProjects = localStorage.getItem('indigo_horizon_projects');
    setProjects(savedProjects ? JSON.parse(savedProjects) : (initialProjectsData as Project[]));

    const savedTasks = localStorage.getItem('indigo_horizon_tasks');
    setTasks(savedTasks ? JSON.parse(savedTasks) : (initialTasksData as Task[]));

    const savedSpecs = localStorage.getItem('indigo_horizon_specialists');
    setSpecialists(savedSpecs ? JSON.parse(savedSpecs) : DEFAULT_SPECIALISTS);

    const savedClients = localStorage.getItem('indigo_horizon_clients');
    setClients(savedClients ? JSON.parse(savedClients) : DEFAULT_CLIENTS);

    const savedConfig = localStorage.getItem('indigo_horizon_config');
    if (savedConfig) setConfig(JSON.parse(savedConfig));

    setHasLoaded(true);
  }, []);

  // Persist all data
  useEffect(() => {
    if (hasLoaded) {
      localStorage.setItem('indigo_horizon_projects', JSON.stringify(projects));
      localStorage.setItem('indigo_horizon_tasks', JSON.stringify(tasks));
      localStorage.setItem('indigo_horizon_specialists', JSON.stringify(specialists));
      localStorage.setItem('indigo_horizon_clients', JSON.stringify(clients));
      localStorage.setItem('indigo_horizon_config', JSON.stringify(config));
    }
  }, [projects, tasks, specialists, clients, config, userRole, hasLoaded]);

  // Automatic Cloud Sync
  useEffect(() => {
    if (!hasLoaded || !config.autoSync || !config.githubToken || !config.githubOwner || !config.githubRepo) return;

    const timeoutId = setTimeout(async () => {
      setSyncStatus('syncing');
      
      const files = [
        { path: 'src/data/initialProjects.json', content: JSON.stringify(projects, null, 2) },
        { path: 'src/data/tasks.json', content: JSON.stringify(tasks, null, 2) },
        { path: 'src/data/specialists.json', content: JSON.stringify(specialists, null, 2) },
        { path: 'src/data/clients.json', content: JSON.stringify(clients, null, 2) },
      ];

      const result = await commitMultipleFiles({
        token: config.githubToken!,
        owner: config.githubOwner!,
        repo: config.githubRepo!,
      }, files);

      if (result.success) {
        setSyncStatus('success');
        setTimeout(() => setSyncStatus('idle'), 3000);
      } else {
        setSyncStatus('error');
      }
    }, 5000); // 5 second debounce

    return () => clearTimeout(timeoutId);
  }, [hasLoaded, projects, tasks, specialists, clients, config.autoSync, config.githubToken, config.githubOwner, config.githubRepo]);

  const handleAddProject = (newProject: Project) => {
    if (!isArchitect) return;
    if (!newProject.stage) newProject.stage = 'Architecture';
    if (!newProject.lifecycleStatus) newProject.lifecycleStatus = 'Por iniciar';
    setProjects(prev => [newProject, ...prev]);
  };

  const handleUpdateProject = (updated: Project) => {
    if (!isArchitect) return;
    setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
    setSelectedProject(updated);
  };

  const handleDeleteProject = (projectId: string) => {
    if (!isArchitect) return;
    setProjects(prev => prev.filter(p => p.id !== projectId));
    setTasks(prev => prev.filter(t => t.projectId !== projectId));
    setSelectedProject(null);
  };

  const handleAddOrUpdateTask = (task: Task) => {
    if (!isArchitect) return;
    setTasks(prev => {
      const exists = prev.find(t => t.id === task.id);
      return exists ? prev.map(t => t.id === task.id ? task : t) : [task, ...prev];
    });
  };

  const handleToggleTask = (id: string) => {
    if (!isArchitect) return;
    const now = new Date().toISOString();
    setTasks(prev => prev.map(t =>
      t.id === id ? { 
        ...t, 
        status: t.status === 'Pending' ? 'Completed' : 'Pending',
        completedAt: t.status === 'Pending' ? now : undefined
      } : t
    ));
  };

  const handleEditTask = (task: Task) => {
    if (!isArchitect) return;
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleDeleteTask = (id: string) => {
    if (!isArchitect) return;
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleRestore = (backup: Partial<AppBackup>) => {
    if (!isArchitect) return;
    if (backup.projects) setProjects(backup.projects);
    if (backup.tasks) setTasks(backup.tasks);
    if (backup.specialists) setSpecialists(backup.specialists);
    if (backup.clients) setClients(backup.clients);
    if (backup.config) setConfig(backup.config);
  };

  const handleSelectSearchResult = (result: { id: string, type: string, projectId?: string }) => {
    if (result.type === 'project') {
      const proj = projects.find(p => p.id === result.id);
      if (proj) setSelectedProject(proj);
    } else if (result.type === 'task') {
      const proj = projects.find(p => p.id === result.projectId);
      if (proj) setSelectedProject(proj);
    } else if (result.type === 'client' || result.type === 'specialist') {
      // For clients/specialists, we filter the dashboard/portfolio view
      const item = result.type === 'client' 
        ? clients.find(c => c.id === result.id) 
        : specialists.find(s => s.id === result.id);
      if (item) {
        setSearchTerm(item.name);
        setCurrentView('dashboard');
      }
    }
  };

  return (
    <div className="flex h-screen bg-surface font-sans text-on-surface overflow-hidden">
      <Sidebar 
        currentView={currentView} 
        onViewChange={(view) => {
          setCurrentView(view);
          if (view === 'dashboard') setSearchTerm('');
        }} 
        onNewProject={() => isArchitect && setIsProjectModalOpen(true)} 
        userRole={userRole}
      />
      
      <main className="flex-1 flex flex-col md:ml-64 overflow-hidden">
        <TopNav 
          onSearch={setSearchTerm} 
          searchTerm={searchTerm}
          onExport={() => exportToExcel(projects)} 
          onImport={async (file) => isArchitect && setProjects(await importFromExcel(file))}
          projects={projects}
          tasks={tasks}
          specialists={specialists}
          clients={clients}
          onNotificationClick={(project) => setSelectedProject(project)}
          onSelectResult={handleSelectSearchResult}
          userRole={userRole}
          onRoleChange={setUserRole}
          syncStatus={syncStatus}
        />
        
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth custom-scrollbar">
          {currentView === 'dashboard' ? (
            <>
              <StatHero projects={projects} />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  <PortfolioList projects={projects} searchTerm={searchTerm} onProjectClick={setSelectedProject} />
                </div>
                <div className="space-y-8">
                  <ActivityFeed 
                    projects={projects} 
                    tasks={tasks} 
                    onViewAll={() => setCurrentView('projects')}
                  />
                </div>
              </div>
            </>
          ) : currentView === 'projects' ? (
            <ProjectsView
              projects={projects}
              onProjectClick={setSelectedProject}
            />
          ) : currentView === 'tasks' ? (
            <TasksView
              tasks={tasks}
              onToggle={handleToggleTask}
              onNewTask={() => { if (isArchitect) { setEditingTask(null); setIsTaskModalOpen(true); } }}
              onEditTask={handleEditTask}
              userRole={userRole}
            />
          ) : currentView === 'sla' ? (
            <SLATracker 
              initialTasks={slaTasksData as any} 
              projects={projects}
              specialists={specialists}
              tasks={tasks} 
              userRole={userRole}
              onUpdateLiveTask={handleAddOrUpdateTask} 
              onDeleteLiveTask={handleDeleteTask}
            />
          ) : currentView === 'settings' ? (
            <SettingsView
              specialists={specialists}
              clients={clients}
              config={config}
              projects={projects}
              tasks={tasks}
              userRole={userRole}
              onUpdateSpecialists={setSpecialists}
              onUpdateClients={setClients}
              onUpdateConfig={setConfig}
              onRestore={handleRestore}
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-20 bg-surface-container-low rounded-3xl border-2 border-dashed border-outline-variant/20 italic text-outline">
              <p className="text-xl font-headline font-bold mb-2">View: {currentView.toUpperCase()}</p>
              <p>Module under construction.</p>
              <button onClick={() => setCurrentView('dashboard')} className="mt-6 text-primary font-bold hover:underline">
                Back to Dashboard
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onAdd={handleAddProject}
        clients={clients}
        specialists={specialists}
      />

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        onAdd={handleAddOrUpdateTask}
        onDelete={handleDeleteTask}
        projects={projects}
        specialists={specialists}
        editTask={editingTask}
      />

      <ProjectDetails
        project={selectedProject}
        tasks={tasks}
        onClose={() => setSelectedProject(null)}
        onUpdate={handleUpdateProject}
        onDelete={handleDeleteProject}
        specialists={specialists}
        clients={clients}
        userRole={userRole}
      />

      {/* FAB (mobile) */}
      {isArchitect && (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsProjectModalOpen(true)}
          className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-white rounded-2xl shadow-2xl flex items-center justify-center lg:hidden z-50 pointer-events-auto"
        >
          <Plus size={24} />
        </motion.button>
      )}
    </div>
  );
}

export default App;

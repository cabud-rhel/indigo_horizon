import { History, CheckCircle, UserPlus, TrendingUp, FileText, Clock, AlertCircle } from 'lucide-react';
import type { Project } from '../utils/excel';
import type { Task } from './TasksView';

interface ActivityFeedProps {
  projects: Project[];
  tasks: Task[];
  onViewAll?: () => void;
}

interface ActivityItem {
  id: string;
  icon: any;
  title: string;
  desc: string;
  time: string;
  timestamp: number;
  color: string;
}

// ── Report Generator ──────────────────────────────────────────────
function generateReport(projects: Project[], tasks: Task[]) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('es', { year: 'numeric', month: 'long', day: 'numeric' });

  const overdueTasks = tasks.filter(t => t.status === 'Pending' && t.dueDate && new Date(t.dueDate) < now);
  const overdueByProject: Record<string, { specialist: string; desc: string }[]> = {};
  overdueTasks.forEach(t => {
    if (!overdueByProject[t.projectId]) overdueByProject[t.projectId] = [];
    overdueByProject[t.projectId].push({ specialist: t.specialist, desc: t.description });
  });

  const statusColor = (s: string) =>
    s === 'On Track' ? '#16a34a' : s === 'At Risk' ? '#d97706' : '#dc2626';

  const lifecycleColor = (l?: string) => {
    const map: Record<string, string> = {
      'Por iniciar': '#64748b', 'Iniciado': '#2563eb', 'En proceso': '#7c3aed',
      'Detenido': '#dc2626', 'Entregado': '#0891b2', 'Terminado': '#16a34a', 'Ganado': '#15803d',
    };
    return map[l || ''] || '#64748b';
  };

  const rows = projects.map(p => {
    const blockers = overdueByProject[p.id] || [];
    const blockersHtml = blockers.length
      ? blockers.map(b => `<span style="background:#fee2e2;color:#991b1b;padding:2px 8px;border-radius:999px;font-size:11px;margin:2px;display:inline-block;">⚠ ${b.specialist}: ${b.desc}</span>`).join('')
      : `<span style="color:#16a34a;font-size:12px;font-weight:600;">✓ Sin retrasos</span>`;

    return `
      <tr>
        <td style="padding:14px 16px;border-bottom:1px solid #f1f5f9;">
          <div style="font-weight:700;color:#1e293b;font-size:14px;">${p.title}</div>
          <div style="color:#64748b;font-size:12px;margin-top:2px;">${p.client}</div>
        </td>
        <td style="padding:14px 16px;border-bottom:1px solid #f1f5f9;">
          <span style="background:${statusColor(p.status)}22;color:${statusColor(p.status)};padding:3px 10px;border-radius:999px;font-size:11px;font-weight:700;">${p.status}</span>
        </td>
        <td style="padding:14px 16px;border-bottom:1px solid #f1f5f9;">
          <span style="background:${lifecycleColor(p.lifecycleStatus)}22;color:${lifecycleColor(p.lifecycleStatus)};padding:3px 10px;border-radius:999px;font-size:11px;font-weight:700;">${p.lifecycleStatus || 'En proceso'}</span>
        </td>
        <td style="padding:14px 16px;border-bottom:1px solid #f1f5f9;text-align:center;">
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="flex:1;background:#e2e8f0;border-radius:999px;height:6px;overflow:hidden;">
              <div style="width:${p.progress}%;background:${statusColor(p.status)};height:100%;border-radius:999px;"></div>
            </div>
            <span style="font-weight:700;color:#1e293b;font-size:12px;min-width:32px;">${p.progress}%</span>
          </div>
        </td>
        <td style="padding:14px 16px;border-bottom:1px solid #f1f5f9;">${p.solutionsArchitect || 'N/A'}</td>
        <td style="padding:14px 16px;border-bottom:1px solid #f1f5f9;">${blockersHtml}</td>
      </tr>`;
  }).join('');

  const onTrack = projects.filter(p => p.status === 'On Track').length;
  const atRisk  = projects.filter(p => p.status === 'At Risk').length;

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Executive Portfolio Report — ${dateStr}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; background: #f8fafc; color: #1e293b; padding: 40px; }
    .header { background: linear-gradient(135deg, #2f3b88 0%, #1e2a6b 100%); color: white; padding: 40px 48px; border-radius: 20px; margin-bottom: 32px; }
    .header h1 { font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
    .header p  { opacity: 0.75; font-size: 13px; margin-top: 6px; }
    .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
    .kpi  { background: white; border-radius: 16px; padding: 20px 24px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
    .kpi .value { font-size: 32px; font-weight: 800; }
    .kpi .label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; margin-top: 4px; }
    .kpi.green .value { color: #16a34a; }
    .kpi.amber .value { color: #d97706; }
    .kpi.red   .value { color: #dc2626; }
    .kpi.blue  .value { color: #2563eb; }
    h2 { font-size: 16px; font-weight: 700; color: #1e293b; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
    thead tr { background: #f1f5f9; }
    th { padding: 12px 16px; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; }
    .footer { margin-top: 32px; text-align: center; font-size: 11px; color: #94a3b8; }
    @media print { body { padding: 20px; background: white; } }
  </style>
</head>
<body>
  <div class="header">
    <div style="opacity:0.6;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;">Indigo Horizon · Portfolio Insights</div>
    <h1>Executive Portfolio Report</h1>
    <p>Generado el ${dateStr} · ${projects.length} proyectos activos bajo gestión</p>
  </div>

  <div class="kpis">
    <div class="kpi blue">
      <div class="value">${projects.length}</div>
      <div class="label">Total Proyectos</div>
    </div>
    <div class="kpi green">
      <div class="value">${onTrack}</div>
      <div class="label">On Track</div>
    </div>
    <div class="kpi amber">
      <div class="value">${atRisk}</div>
      <div class="label">At Risk</div>
    </div>
    <div class="kpi red">
      <div class="value">${overdueTasks.length}</div>
      <div class="label">Tareas Atrasadas</div>
    </div>
  </div>

  <h2>Estado Detallado por Proyecto</h2>
  <table>
    <thead>
      <tr>
        <th>Proyecto / Cliente</th>
        <th>Estado</th>
        <th>Lifecycle Phase</th>
        <th style="min-width:140px;">Avance</th>
        <th>Arquitecto</th>
        <th>Especialistas con Retraso</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="footer">
    Generado automáticamente por Indigo Horizon · Solution Lifecycle Manager<br/>
    ${dateStr} — Confidencial
  </div>

  <script>window.onload = () => window.print();</script>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}

function timeAgo(dateContent: string | number): string {
  const date = new Date(dateContent);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'hace un momento';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `hace ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `hace ${days}d`;
}

// ── Component ─────────────────────────────────────────────────────
export const ActivityFeed = ({ projects = [], tasks = [], onViewAll }: ActivityFeedProps) => {
  
  const getActivities = (): ActivityItem[] => {
    const activities: ActivityItem[] = [];
    const nowTs = Date.now();

    // 1. Project Creations
    projects.forEach(p => {
      activities.push({
        id: `p-new-${p.id}`,
        icon: UserPlus,
        title: 'Nuevo Proyecto Registrado',
        desc: `${p.title} para ${p.client}`,
        time: timeAgo(p.createdAt),
        timestamp: new Date(p.createdAt).getTime(),
        color: 'bg-primary/10 text-primary'
      });
    });

    // 2. Task Completions
    tasks.filter(t => t.status === 'Completed' && t.completedAt).forEach(t => {
      activities.push({
        id: `t-done-${t.id}`,
        icon: CheckCircle,
        title: 'Tarea Finalizada',
        desc: `${t.description} por ${t.specialist}`,
        time: timeAgo(t.completedAt!),
        timestamp: new Date(t.completedAt!).getTime(),
        color: 'bg-secondary/10 text-secondary'
      });
    });

    // 3. Overdue Tasks (Recent alerts)
    tasks.filter(t => t.status === 'Pending' && new Date(t.dueDate) < new Date()).forEach(t => {
      activities.push({
        id: `t-over-${t.id}`,
        icon: AlertCircle,
        title: 'SLA Alerta: Tarea Vencida',
        desc: `${t.description} (${t.specialist})`,
        time: 'Crítico',
        timestamp: nowTs + 1000, // Always keep at top if currently overdue
        color: 'bg-error/10 text-error'
      });
    });

    // Sort by timestamp desc
    return activities.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
  };

  const activityList = getActivities();

  return (
    <aside className="lg:col-span-1">
      <div className="bg-surface-container-low rounded-[40px] p-8 space-y-8 sticky top-24 border border-outline-variant/10 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-headline font-extrabold text-primary tracking-tight">Live Activity</h3>
          <button 
            onClick={onViewAll}
            className="text-primary text-[10px] font-black hover:underline uppercase tracking-widest bg-primary/5 px-3 py-1 rounded-full transition-all"
          >
            Ver Todo
          </button>
        </div>

        <div className="space-y-8">
          {activityList.length === 0 ? (
            <div className="py-10 text-center space-y-3">
               <History size={32} className="mx-auto text-outline/20" />
               <p className="text-[10px] font-bold text-outline uppercase tracking-widest">Sin actividad reciente</p>
            </div>
          ) : (
            activityList.map((item, idx) => (
              <div key={item.id} className="flex gap-4 relative">
                {idx !== activityList.length - 1 && (
                  <div className="absolute left-4 top-10 bottom-[-32px] w-[1px] bg-outline-variant/20" />
                )}
                <div className={`w-8 h-8 rounded-2xl flex items-center justify-center z-10 shadow-sm border border-white/10 ${item.color}`}>
                  <item.icon size={14} />
                </div>
                <div>
                  <p className="text-sm font-bold text-primary leading-tight">{item.title}</p>
                  <p className="text-xs text-outline mt-1 leading-relaxed font-medium">{item.desc}</p>
                  <p className="text-[9px] font-bold text-primary/40 uppercase mt-2 tracking-widest flex items-center gap-1">
                    <Clock size={10} /> {item.time}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* CTA — Executive Report */}
        <div className="bg-primary p-6 rounded-[32px] mt-10 text-white relative overflow-hidden group shadow-xl shadow-primary/20">
          <div className="relative z-10">
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Portfolio Insights</p>
            <h4 className="text-lg font-headline font-extrabold mb-1 leading-tight tracking-tight">Executive Report</h4>
            <p className="text-[10px] opacity-70 font-medium mb-4">
              {projects.length} proyectos · {tasks.filter(t => t.status === 'Pending' && t.dueDate && new Date(t.dueDate) < new Date()).length} tareas atrasadas
            </p>
            <button
              onClick={() => generateReport(projects, tasks)}
              className="w-full bg-white text-primary py-3 rounded-2xl text-[10px] font-black shadow-lg hover:bg-surface-container-high transition-all uppercase tracking-widest flex items-center justify-center gap-2 group-hover:scale-[1.02] active:scale-[0.98]"
            >
              <FileText size={14} />
              Generar Reporte Pro
            </button>
          </div>
          <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:rotate-12 transition-all duration-700">
            <TrendingUp size={120} />
          </div>
        </div>
      </div>
    </aside>
  );
};

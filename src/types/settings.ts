export type UserRole = 'Architect' | 'Specialist';

export interface Specialist {
  id: string;
  name: string;
  role: string;
  initials: string;
  email?: string;
  active: boolean;
}

export interface Client {
  id: string;
  name: string;
  industry: string;
  active: boolean;
}

export interface SystemConfig {
  slaThresholdAtRisk: number; // e.g. 0.75 (75% of SLA elapsed)
  predictiveAlerts: boolean;
  theme: 'light' | 'dark' | 'system';
  lastBackup?: string;
  githubToken?: string;
  githubOwner?: string;
  githubRepo?: string;
  autoSync?: boolean;
}

export interface AppBackup {
  version: string;
  timestamp: string;
  projects: any[];
  tasks: any[];
  specialists: Specialist[];
  clients: Client[];
  config: SystemConfig;
}

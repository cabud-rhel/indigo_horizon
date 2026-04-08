import * as XLSX from 'xlsx';

export interface Project {
  id: string;
  title: string;
  client: string;
  solutionsArchitect: string;
  projectLeader: string;
  salesperson: string;
  initials: string;
  progress: number;
  status: 'On Track' | 'At Risk' | 'Overdue';
  stage: 'Tendering' | 'Architecture' | 'Technical Review' | 'Delivery';
  lifecycleStatus?: 'Por iniciar' | 'Iniciado' | 'En proceso' | 'Detenido' | 'Entregado' | 'Terminado' | 'Ganado';
  img?: string;
  referentialNotes?: string;
  referentialImages?: string[]; // base64 data URLs
  createdAt: string;
  startDate: string;
  deliveryDate: string;
}

export const exportToExcel = (projects: Project[]) => {
  const worksheet = XLSX.utils.json_to_sheet(projects);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Projects");
  XLSX.writeFile(workbook, `Indigo_Horizon_Projects_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const importFromExcel = (file: File): Promise<Project[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet) as Project[];
        resolve(json);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};

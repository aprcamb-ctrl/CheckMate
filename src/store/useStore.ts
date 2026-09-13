import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type JobStatus = 'PENDING' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED';

export interface TimeLog {
  startedAt: string;
  endedAt?: string;
}

export interface Job {
  id: string;
  title: string;
  status: JobStatus;
  timeLogs: TimeLog[];
  createdAt: string;
  completedAt?: string;
  reminder?: boolean;
  reminderDate?: string;
}

export interface Material {
  id: string;
  name: string;
  qty: number | string;
  price: number;
}

export interface MaterialUsage {
  materialId: string;
  quantity: number;
}

export interface Job {
  id: string;
  title: string;
  status: JobStatus;
  timeLogs: TimeLog[];
  materialsUsed?: MaterialUsage[];
  photos?: string[];
  createdAt: string;
  completedAt?: string;
  reminder?: boolean;
  reminderDate?: string;
}

interface AppState {
  jobs: Job[];
  materials: Material[];
  isDarkMode: boolean;
  isDeletingJobs: boolean;
  isDeletingMaterials: boolean;
  
  // Actions
  addJob: (title: string, reminder?: boolean, reminderDate?: string) => void;
  updateJobStatus: (id: string, status: JobStatus) => void;
  startJob: (id: string) => void;
  pauseJob: (id: string) => void;
  completeJob: (id: string) => void;
  overrideJobTime: (id: string, totalSeconds: number) => void;
  deleteJobs: (ids: string[]) => void;
  toggleDeletingJobs: (value: boolean) => void;
  addMaterial: (name: string, qty: number | string, price: number) => void;
  updateMaterial: (id: string, name: string, qty: number | string, price: number) => void;
  deleteMaterial: (id: string) => void;
  deleteMaterials: (ids: string[]) => void;
  toggleDeletingMaterials: (value: boolean) => void;
  assignMaterialToJob: (jobId: string, materialId: string, quantity: number) => void;
  addPhotoToJob: (jobId: string, photoBase64: string) => void;
  toggleDarkMode: () => void;
  injectTestData: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      isDarkMode: false,
      isDeletingJobs: false,
      isDeletingMaterials: false,
      jobs: [
        { id: '1', title: 'Fix AC Unit in Room 402', status: 'PENDING', timeLogs: [], materialsUsed: [], photos: [], createdAt: new Date().toISOString(), reminder: true },
        { id: '2', title: 'Replace lobby lightbulbs', status: 'IN_PROGRESS', timeLogs: [{ startedAt: new Date(Date.now() - 3600000).toISOString() }], materialsUsed: [], photos: [], createdAt: new Date().toISOString() },
      ],
      materials: [
        { id: '1', name: 'Lightbulbs (LED 60W)', qty: 45, price: 4.50 },
        { id: '2', name: 'Air Filters (20x20x1)', qty: 12, price: 18.99 },
      ],

      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),

      addJob: (title, reminder, reminderDate) => set((state) => ({
        jobs: [
          ...state.jobs, 
          { 
            id: Date.now().toString(), 
            title, 
            status: 'PENDING', 
            timeLogs: [], 
            materialsUsed: [],
            createdAt: new Date().toISOString(),
            reminder,
            reminderDate
          }
        ]
      })),

      updateJobStatus: (id, status) => set((state) => ({
        jobs: state.jobs.map(j => j.id === id ? { ...j, status } : j)
      })),

      startJob: (id) => set((state) => ({
        jobs: state.jobs.map(j => {
          if (j.id !== id) return j;
          return {
            ...j,
            status: 'IN_PROGRESS',
            timeLogs: [...j.timeLogs, { startedAt: new Date().toISOString() }]
          };
        })
      })),

      pauseJob: (id) => set((state) => ({
        jobs: state.jobs.map(j => {
          if (j.id !== id) return j;
          const newLogs = [...j.timeLogs];
          if (newLogs.length > 0 && !newLogs[newLogs.length - 1].endedAt) {
            newLogs[newLogs.length - 1].endedAt = new Date().toISOString();
          }
          return {
            ...j,
            status: 'PAUSED',
            timeLogs: newLogs
          };
        })
      })),

      completeJob: (id) => set((state) => {
        get().pauseJob(id);
        return {
          jobs: get().jobs.map(j => {
            if (j.id !== id) return j;
            return {
              ...j,
              status: 'COMPLETED',
              completedAt: new Date().toISOString()
            };
          })
        };
      }),

      overrideJobTime: (id, totalSeconds) => set((state) => ({
        jobs: state.jobs.map(j => {
          if (j.id !== id) return j;
          const end = j.completedAt ? new Date(j.completedAt) : new Date();
          const start = new Date(end.getTime() - totalSeconds * 1000);
          return {
            ...j,
            timeLogs: [{ startedAt: start.toISOString(), endedAt: end.toISOString() }]
          };
        })
      })),

      addMaterial: (name, qty, price) => set((state) => ({
        materials: [...state.materials, { id: Date.now().toString(), name, qty, price }]
      })),

      updateMaterial: (id, name, qty, price) => set((state) => ({
        materials: state.materials.map(m => m.id === id ? { ...m, name, qty, price } : m)
      })),

      deleteMaterial: (id) => set((state) => ({
        materials: state.materials.filter(m => m.id !== id)
      })),

      deleteMaterials: (ids) => set((state) => ({
        materials: state.materials.filter(m => !ids.includes(m.id)),
        isDeletingMaterials: false
      })),

      toggleDeletingMaterials: (value) => set(() => ({
        isDeletingMaterials: value
      })),

      deleteJobs: (ids) => set((state) => ({
        jobs: state.jobs.filter(j => !ids.includes(j.id)),
        isDeletingJobs: false
      })),

      toggleDeletingJobs: (value) => set(() => ({
        isDeletingJobs: value
      })),

      assignMaterialToJob: (jobId, materialId, quantity) => set((state) => ({
        jobs: state.jobs.map(j => {
          if (j.id !== jobId) return j;
          const materialsUsed = j.materialsUsed || [];
          const existing = materialsUsed.find(m => m.materialId === materialId);
          if (existing) {
            return { ...j, materialsUsed: materialsUsed.map(m => m.materialId === materialId ? { ...m, quantity: m.quantity + quantity } : m) };
          }
          return { ...j, materialsUsed: [...materialsUsed, { materialId, quantity }] };
        })
      })),

      addPhotoToJob: (jobId, photoBase64) => set((state) => ({
        jobs: state.jobs.map(j => {
          if (j.id !== jobId) return j;
          return { ...j, photos: [...(j.photos || []), photoBase64] };
        })
      })),

      injectTestData: () => set((state) => {
        const testJobs: Job[] = [
          {
            id: 'test-1',
            title: 'Repaint Conference Room',
            status: 'COMPLETED',
            timeLogs: [{ startedAt: '2026-07-15T09:00:00Z', endedAt: '2026-07-15T14:30:00Z' }],
            materialsUsed: [],
            photos: [],
            createdAt: '2026-07-14T10:00:00Z',
            completedAt: '2026-07-15T14:30:00Z'
          },
          {
            id: 'test-2',
            title: 'Fix Plumbing in Restroom',
            status: 'COMPLETED',
            timeLogs: [{ startedAt: '2026-08-02T11:00:00Z', endedAt: '2026-08-02T12:45:00Z' }],
            materialsUsed: [],
            photos: [],
            createdAt: '2026-08-01T08:00:00Z',
            completedAt: '2026-08-02T12:45:00Z'
          },
          {
            id: 'test-3',
            title: 'Install New Desks (HR Dept)',
            status: 'COMPLETED',
            timeLogs: [
              { startedAt: '2026-08-20T09:00:00Z', endedAt: '2026-08-20T17:00:00Z' },
              { startedAt: '2026-08-21T09:00:00Z', endedAt: '2026-08-21T13:00:00Z' }
            ],
            materialsUsed: [],
            photos: [],
            createdAt: '2026-08-15T09:00:00Z',
            completedAt: '2026-08-21T13:00:00Z'
          },
          {
            id: 'test-4',
            title: 'Monthly HVAC Maintenance',
            status: 'COMPLETED',
            timeLogs: [{ startedAt: '2026-09-05T08:30:00Z', endedAt: '2026-09-05T10:00:00Z' }],
            materialsUsed: [],
            photos: [],
            createdAt: '2026-09-01T09:00:00Z',
            completedAt: '2026-09-05T10:00:00Z'
          }
        ];
        const cleanJobs = state.jobs.filter(j => !j.id.startsWith('test-'));
        return { jobs: [...cleanJobs, ...testJobs] };
      })
    }),
    {
      name: 'checkmate-storage', // name of the item in the storage (must be unique)
    }
  )
);

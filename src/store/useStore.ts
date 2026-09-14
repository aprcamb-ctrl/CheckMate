import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type JobStatus = 'PENDING' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED';

export type RecurringSchedule = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ANNUALLY';

export interface TimeLog {
  startedAt: string; // ISO String
  endedAt?: string;  // ISO String
}

export interface Job {
  id: string;
  title: string;
  status: JobStatus;
  timeLogs: TimeLog[];
  materialsUsed?: MaterialUsage[];
  beforePhotos?: string[];
  afterPhotos?: string[];
  createdAt: string;
  completedAt?: string;
  reminder?: boolean;
  reminderDate?: string;
  recurringSchedule?: RecurringSchedule;
  equipmentId?: string;
  eventId?: string;
}

export interface Material {
  id: string;
  name: string;
  qty: number | string;
  price: number;
  isPurchased?: boolean;
}

export interface MaterialUsage {
  materialId: string;
  quantity: number;
}

export interface Equipment {
  id: string;
  name: string;
  location: string;
  status: 'Operational' | 'Needs Repair' | 'Out of Service';
  createdAt: string;
}

export interface Event {
  id: string;
  name: string;
  date?: string;
  createdAt: string;
}

export interface Receipt {
  id: string;
  jobId?: string;
  photoBase64: string;
  description: string;
  amount: number;
  isPaid: boolean;
  paidAt?: string;
  createdAt: string;
}

interface AppState {
  jobs: Job[];
  materials: Material[];
  equipment: Equipment[];
  events: Event[];
  receipts: Receipt[];
  isDarkMode: boolean;
  isDeletingJobs: boolean;
  isDeletingMaterials: boolean;
  
  // Actions
  addJob: (title: string, reminder?: boolean, reminderDate?: string, recurringSchedule?: RecurringSchedule, equipmentId?: string, eventId?: string) => void;
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
  toggleMaterialPurchased: (id: string) => void;
  assignMaterialToJob: (jobId: string, materialId: string, quantity: number) => void;
  addPhotoToJob: (jobId: string, photoBase64: string, type: 'before' | 'after') => void;
  addEquipment: (name: string, location: string) => void;
  updateEquipmentStatus: (id: string, status: Equipment['status']) => void;
  deleteEquipment: (id: string) => void;
  addEvent: (name: string, date?: string) => void;
  deleteEvent: (id: string) => void;
  addReceipt: (photoBase64: string, description: string, amount: number, jobId?: string) => void;
  updateReceipt: (id: string, description: string, amount: number, jobId?: string) => void;
  toggleReceiptPaid: (id: string) => void;
  deleteReceipt: (id: string) => void;
  toggleDarkMode: () => void;
  injectTestData: () => void;
  clearTestData: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      isDarkMode: false,
      isDeletingJobs: false,
      isDeletingMaterials: false,
      jobs: [
        { id: '1', title: 'Fix AC Unit in Room 402', status: 'PENDING', timeLogs: [], materialsUsed: [], beforePhotos: [], afterPhotos: [], createdAt: new Date().toISOString(), reminder: true },
        { id: '2', title: 'Replace lobby lightbulbs', status: 'IN_PROGRESS', timeLogs: [{ startedAt: new Date(Date.now() - 3600000).toISOString() }], materialsUsed: [], beforePhotos: [], afterPhotos: [], createdAt: new Date().toISOString() },
      ],
      materials: [
        { id: '1', name: 'Lightbulbs (LED 60W)', qty: 45, price: 4.50 },
        { id: '2', name: 'Air Filters (20x20x1)', qty: 12, price: 18.99 },
      ],
      equipment: [
        { id: 'EQ-1001', name: 'Main Lobby HVAC', location: 'Roof North', status: 'Operational', createdAt: new Date().toISOString() },
        { id: 'EQ-1002', name: 'Pool Pump A', location: 'Basement', status: 'Needs Repair', createdAt: new Date().toISOString() },
      ],
      events: [],
      receipts: [],

      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),

      addJob: (title, reminder, reminderDate, recurringSchedule, equipmentId, eventId) => set((state) => ({
        jobs: [
          ...state.jobs, 
          { 
            id: Date.now().toString(), 
            title, 
            status: 'PENDING', 
            timeLogs: [], 
            materialsUsed: [],
            beforePhotos: [],
            afterPhotos: [],
            createdAt: new Date().toISOString(),
            reminder,
            reminderDate,
            recurringSchedule,
            equipmentId,
            eventId
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

      completeJob: (id) => set(() => {
        get().pauseJob(id);
        const currentJob = get().jobs.find(j => j.id === id);
        
        let newJob: Job | null = null;
        if (currentJob && currentJob.recurringSchedule && currentJob.recurringSchedule !== 'NONE') {
          let nextDate = new Date();
          if (currentJob.recurringSchedule === 'DAILY') {
            nextDate.setDate(nextDate.getDate() + 1);
          } else if (currentJob.recurringSchedule === 'WEEKLY') {
            nextDate.setDate(nextDate.getDate() + 7);
          } else if (currentJob.recurringSchedule === 'MONTHLY') {
            nextDate.setMonth(nextDate.getMonth() + 1);
          } else if (currentJob.recurringSchedule === 'ANNUALLY') {
            nextDate.setFullYear(nextDate.getFullYear() + 1);
          }
          
          newJob = {
            id: Date.now().toString() + Math.random().toString(36).substring(7),
            title: currentJob.title,
            status: 'PENDING' as JobStatus,
            timeLogs: [],
            materialsUsed: [],
            beforePhotos: [],
            afterPhotos: [],
            createdAt: new Date().toISOString(),
            reminder: currentJob.reminder,
            reminderDate: nextDate.toISOString(),
            recurringSchedule: currentJob.recurringSchedule,
            equipmentId: currentJob.equipmentId,
            eventId: currentJob.eventId
          };
        }

        return {
          jobs: [
            ...get().jobs.map(j => {
              if (j.id !== id) return j;
              return {
                ...j,
                status: 'COMPLETED' as JobStatus,
                completedAt: new Date().toISOString()
              };
            }),
            ...(newJob ? [newJob] : [])
          ]
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

      toggleMaterialPurchased: (id) => set((state) => ({
        materials: state.materials.map(m => m.id === id ? { ...m, isPurchased: !m.isPurchased } : m)
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

      addPhotoToJob: (jobId, photoBase64, type) => set((state) => ({
        jobs: state.jobs.map(j => {
          if (j.id !== jobId) return j;
          if (type === 'before') {
            return { ...j, beforePhotos: [...(j.beforePhotos || []), photoBase64] };
          }
          return { ...j, afterPhotos: [...(j.afterPhotos || []), photoBase64] };
        })
      })),

      addEquipment: (name, location) => set((state) => ({
        equipment: [...state.equipment, { id: 'EQ-' + Math.floor(1000 + Math.random() * 9000), name, location, status: 'Operational', createdAt: new Date().toISOString() }]
      })),

      updateEquipmentStatus: (id, status) => set((state) => ({
        equipment: state.equipment.map(e => e.id === id ? { ...e, status } : e)
      })),

      deleteEquipment: (id) => set((state) => ({
        equipment: state.equipment.filter(e => e.id !== id)
      })),

      addEvent: (name, date) => set((state) => ({
        events: [...state.events, { id: 'EV-' + Date.now(), name, date, createdAt: new Date().toISOString() }]
      })),

      deleteEvent: (id) => set((state) => ({
        events: state.events.filter(e => e.id !== id)
      })),

      addReceipt: (photoBase64, description, amount, jobId) => set((state) => ({
        receipts: [...state.receipts, {
          id: 'RCPT-' + Date.now(),
          jobId,
          photoBase64,
          description,
          amount,
          isPaid: false,
          createdAt: new Date().toISOString()
        }]
      })),

      updateReceipt: (id, description, amount, jobId) => set((state) => ({
        receipts: state.receipts.map(r => r.id === id ? { ...r, description, amount, jobId } : r)
      })),

      toggleReceiptPaid: (id) => set((state) => ({
        receipts: state.receipts.map(r => {
          if (r.id !== id) return r;
          const isPaid = !r.isPaid;
          return { ...r, isPaid, paidAt: isPaid ? new Date().toISOString() : undefined };
        })
      })),

      deleteReceipt: (id) => set((state) => ({
        receipts: state.receipts.filter(r => r.id !== id)
      })),

      injectTestData: () => set((state) => {
        const testJobs: Job[] = [
          {
            id: 'test-1',
            title: 'Repaint Conference Room',
            status: 'COMPLETED',
            timeLogs: [{ startedAt: '2026-07-15T09:00:00Z', endedAt: '2026-07-15T14:30:00Z' }],
            materialsUsed: [],
            beforePhotos: [],
            afterPhotos: [],
            createdAt: '2026-07-14T10:00:00Z',
            completedAt: '2026-07-15T14:30:00Z'
          },
          {
            id: 'test-2',
            title: 'Fix Plumbing in Restroom',
            status: 'COMPLETED',
            timeLogs: [{ startedAt: '2026-08-02T11:00:00Z', endedAt: '2026-08-02T12:45:00Z' }],
            materialsUsed: [],
            beforePhotos: [],
            afterPhotos: [],
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
            beforePhotos: [],
            afterPhotos: [],
            createdAt: '2026-08-15T09:00:00Z',
            completedAt: '2026-08-21T13:00:00Z'
          },
          {
            id: 'test-4',
            title: 'Monthly HVAC Maintenance',
            status: 'COMPLETED',
            timeLogs: [{ startedAt: '2026-09-05T08:30:00Z', endedAt: '2026-09-05T10:00:00Z' }],
            materialsUsed: [],
            beforePhotos: [],
            afterPhotos: [],
            createdAt: '2026-09-01T09:00:00Z',
            completedAt: '2026-09-05T10:00:00Z'
          }
        ];
        const cleanJobs = state.jobs.filter(j => !j.id.startsWith('test-'));
        return { jobs: [...cleanJobs, ...testJobs] };
      }),
      
      clearTestData: () => set((state) => ({
        jobs: state.jobs.filter(j => !j.id.startsWith('test-'))
      }))
    }),
    {
      name: 'checkmate-storage', // name of the item in the storage (must be unique)
    }
  )
);

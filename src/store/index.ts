import { create } from 'zustand';
import type { Target, Alert, Fence, Device, WorkOrder, AlertStatus, WorkOrderStatus } from '@/types';
import { mockTargets, mockAlerts, mockFences, mockDevices, mockWorkOrders } from '@/data/mockData';
import { serializeState, deserializeState } from '@/lib/utils';

const STORAGE_KEY = 'drone-detection-state';

interface PersistableState {
  alerts: Alert[];
  fences: Fence[];
  workOrders: WorkOrder[];
}

interface AppState {
  targets: Target[];
  alerts: Alert[];
  fences: Fence[];
  devices: Device[];
  workOrders: WorkOrder[];
  selectedTarget: Target | null;
  selectedAlert: Alert | null;
  selectedFence: Fence | null;
  currentTime: Date;
  setTargets: (targets: Target[]) => void;
  setAlerts: (alerts: Alert[]) => void;
  setFences: (fences: Fence[]) => void;
  setDevices: (devices: Device[]) => void;
  setWorkOrders: (workOrders: WorkOrder[]) => void;
  setSelectedTarget: (target: Target | null) => void;
  setSelectedAlert: (alert: Alert | null) => void;
  setSelectedFence: (fence: Fence | null) => void;
  updateAlertStatus: (alertId: string, status: AlertStatus) => void;
  addFence: (fence: Fence) => void;
  updateFence: (fence: Fence) => void;
  deleteFence: (fenceId: string) => void;
  addWorkOrder: (workOrder: WorkOrder) => void;
  updateWorkOrderStatus: (workOrderId: string, status: WorkOrderStatus) => void;
  updateWorkOrder: (workOrderId: string, updates: Partial<WorkOrder>) => void;
  updateTargetPosition: () => void;
  updateCurrentTime: () => void;
  resetAllData: () => void;
}

function loadPersistedState(): Partial<PersistableState> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return {};
    const parsed = JSON.parse(saved);
    return deserializeState(parsed);
  } catch (e) {
    console.warn('Failed to load persisted state:', e);
    return {};
  }
}

function persistState(state: PersistableState) {
  try {
    const serialized = serializeState(state);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
  } catch (e) {
    console.warn('Failed to persist state:', e);
  }
}

const persisted = loadPersistedState();

export const useAppStore = create<AppState>((set, get) => ({
  targets: mockTargets,
  alerts: persisted.alerts ?? mockAlerts,
  fences: persisted.fences ?? mockFences,
  devices: mockDevices,
  workOrders: persisted.workOrders ?? mockWorkOrders,
  selectedTarget: null,
  selectedAlert: null,
  selectedFence: null,
  currentTime: new Date(),

  setTargets: (targets) => set({ targets }),
  setAlerts: (alerts) => {
    set({ alerts });
    persistState({ alerts, fences: get().fences, workOrders: get().workOrders });
  },
  setFences: (fences) => {
    set({ fences });
    persistState({ alerts: get().alerts, fences, workOrders: get().workOrders });
  },
  setDevices: (devices) => set({ devices }),
  setWorkOrders: (workOrders) => {
    set({ workOrders });
    persistState({ alerts: get().alerts, fences: get().fences, workOrders });
  },
  setSelectedTarget: (target) => set({ selectedTarget: target }),
  setSelectedAlert: (alert) => set({ selectedAlert: alert }),
  setSelectedFence: (fence) => set({ selectedFence: fence }),

  updateAlertStatus: (alertId, status) =>
    set((state) => {
      const alerts = state.alerts.map((a) => (a.id === alertId ? { ...a, status } : a));
      persistState({ alerts, fences: state.fences, workOrders: state.workOrders });
      return { alerts };
    }),

  addFence: (fence) =>
    set((state) => {
      const fences = [...state.fences, fence];
      persistState({ alerts: state.alerts, fences, workOrders: state.workOrders });
      return { fences };
    }),

  updateFence: (fence) =>
    set((state) => {
      const fences = state.fences.map((f) => (f.id === fence.id ? fence : f));
      persistState({ alerts: state.alerts, fences, workOrders: state.workOrders });
      return { fences };
    }),

  deleteFence: (fenceId) =>
    set((state) => {
      const fences = state.fences.filter((f) => f.id !== fenceId);
      persistState({ alerts: state.alerts, fences, workOrders: state.workOrders });
      return {
        fences,
        selectedFence: state.selectedFence?.id === fenceId ? null : state.selectedFence,
      };
    }),

  addWorkOrder: (workOrder) =>
    set((state) => {
      const workOrders = [...state.workOrders, workOrder];
      persistState({ alerts: state.alerts, fences: state.fences, workOrders });
      return { workOrders };
    }),

  updateWorkOrderStatus: (workOrderId, status) =>
    set((state) => {
      const workOrders = state.workOrders.map((w) =>
        w.id === workOrderId
          ? { ...w, status, closedAt: status === 'completed' || status === 'closed' ? new Date() : undefined }
          : w
      );
      persistState({ alerts: state.alerts, fences: state.fences, workOrders });
      return { workOrders };
    }),

  updateWorkOrder: (workOrderId, updates) =>
    set((state) => {
      const workOrders = state.workOrders.map((w) =>
        w.id === workOrderId ? { ...w, ...updates } : w
      );
      persistState({ alerts: state.alerts, fences: state.fences, workOrders });
      return { workOrders };
    }),

  updateTargetPosition: () => {
    const { targets } = get();
    const updatedTargets = targets.map((target) => {
      const rad = (target.direction * Math.PI) / 180;
      const speedFactor = target.speed * 0.00001;
      const newLat = target.trajectory[target.trajectory.length - 1].lat + Math.sin(rad) * speedFactor;
      const newLng = target.trajectory[target.trajectory.length - 1].lng + Math.cos(rad) * speedFactor;
      const newAltitude = target.altitude + (Math.random() - 0.5) * 2;

      const newPoint = {
        lat: newLat,
        lng: newLng,
        altitude: Math.max(10, Math.min(500, newAltitude)),
        timestamp: new Date(),
      };

      const newTrajectory = [...target.trajectory, newPoint];
      if (newTrajectory.length > 50) {
        newTrajectory.shift();
      }

      return {
        ...target,
        altitude: newPoint.altitude,
        speed: Math.max(1, target.speed + (Math.random() - 0.5) * 0.5),
        lastSeen: new Date(),
        trajectory: newTrajectory,
      };
    });
    set({ targets: updatedTargets });
  },

  updateCurrentTime: () => set({ currentTime: new Date() }),

  resetAllData: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({
      alerts: mockAlerts,
      fences: mockFences,
      workOrders: mockWorkOrders,
    });
  },
}));

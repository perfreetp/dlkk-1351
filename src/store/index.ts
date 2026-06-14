import { create } from 'zustand';
import type { Target, Alert, Fence, Device, WorkOrder, AlertStatus, WorkOrderStatus } from '@/types';
import { mockTargets, mockAlerts, mockFences, mockDevices, mockWorkOrders } from '@/data/mockData';

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
}

export const useAppStore = create<AppState>((set, get) => ({
  targets: mockTargets,
  alerts: mockAlerts,
  fences: mockFences,
  devices: mockDevices,
  workOrders: mockWorkOrders,
  selectedTarget: null,
  selectedAlert: null,
  selectedFence: null,
  currentTime: new Date(),

  setTargets: (targets) => set({ targets }),
  setAlerts: (alerts) => set({ alerts }),
  setFences: (fences) => set({ fences }),
  setDevices: (devices) => set({ devices }),
  setWorkOrders: (workOrders) => set({ workOrders }),
  setSelectedTarget: (target) => set({ selectedTarget: target }),
  setSelectedAlert: (alert) => set({ selectedAlert: alert }),
  setSelectedFence: (fence) => set({ selectedFence: fence }),

  updateAlertStatus: (alertId, status) =>
    set((state) => ({
      alerts: state.alerts.map((a) => (a.id === alertId ? { ...a, status } : a)),
    })),

  addFence: (fence) =>
    set((state) => ({
      fences: [...state.fences, fence],
    })),

  updateFence: (fence) =>
    set((state) => ({
      fences: state.fences.map((f) => (f.id === fence.id ? fence : f)),
    })),

  deleteFence: (fenceId) =>
    set((state) => ({
      fences: state.fences.filter((f) => f.id !== fenceId),
      selectedFence: state.selectedFence?.id === fenceId ? null : state.selectedFence,
    })),

  addWorkOrder: (workOrder) =>
    set((state) => ({
      workOrders: [...state.workOrders, workOrder],
    })),

  updateWorkOrderStatus: (workOrderId, status) =>
    set((state) => ({
      workOrders: state.workOrders.map((w) =>
        w.id === workOrderId
          ? { ...w, status, closedAt: status === 'completed' || status === 'closed' ? new Date() : undefined }
          : w
      ),
    })),

  updateWorkOrder: (workOrderId, updates) =>
    set((state) => ({
      workOrders: state.workOrders.map((w) =>
        w.id === workOrderId ? { ...w, ...updates } : w
      ),
    })),

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
        speed: target.speed + (Math.random() - 0.5) * 0.5,
        lastSeen: new Date(),
        trajectory: newTrajectory,
      };
    });
    set({ targets: updatedTargets });
  },

  updateCurrentTime: () => set({ currentTime: new Date() }),
}));

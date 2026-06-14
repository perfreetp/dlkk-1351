export type AlertLevel = 1 | 2 | 3;

export type AlertStatus = 'pending' | 'confirmed' | 'false_positive' | 'escalated' | 'resolved';

export type FenceType = 'forbidden' | 'height_limit' | 'temporary';

export type DeviceStatus = 'online' | 'offline' | 'fault';

export type WorkOrderStatus = 'pending' | 'processing' | 'completed' | 'closed';

export type DeviceType = 'radar' | 'telemetry' | 'photoelectric';

export interface TrajectoryPoint {
  lat: number;
  lng: number;
  altitude: number;
  timestamp: Date;
}

export interface Target {
  id: string;
  type: string;
  altitude: number;
  speed: number;
  direction: number;
  firstSeen: Date;
  lastSeen: Date;
  trajectory: TrajectoryPoint[];
}

export interface Alert {
  id: string;
  targetId: string;
  deviceId: string;
  fenceId: string;
  level: AlertLevel;
  status: AlertStatus;
  alertTime: Date;
  position: { lat: number; lng: number };
  description: string;
}

export interface Fence {
  id: string;
  name: string;
  type: FenceType;
  maxHeight: number;
  coordinates: { lat: number; lng: number }[];
  startTime?: Date;
  endTime?: Date;
  alertLevel: AlertLevel;
}

export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  position: { lat: number; lng: number };
  coverageRadius: number;
  status: DeviceStatus;
  lastHeartbeat: Date;
}

export interface WorkOrder {
  id: string;
  alertId: string;
  handler: string;
  contact: string;
  status: WorkOrderStatus;
  measures: {
    check?: string;
    announcement?: string;
    intercept?: string;
  };
  result: string;
  createdAt: Date;
  closedAt?: Date;
}

export interface StatisticsData {
  date: string;
  count: number;
  level1: number;
  level2: number;
  level3: number;
}

export interface AreaStats {
  name: string;
  count: number;
  color: string;
}

export interface TypeStats {
  type: string;
  count: number;
}

export interface TimeSlotStats {
  slot: string;
  count: number;
}

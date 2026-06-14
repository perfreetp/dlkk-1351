import type { Target, Alert, Fence, Device, WorkOrder, StatisticsData, AreaStats, TypeStats, TimeSlotStats } from '@/types';

const now = new Date();

export const mockTargets: Target[] = [
  {
    id: 'T-001',
    type: '多旋翼无人机',
    altitude: 120,
    speed: 8.5,
    direction: 45,
    firstSeen: new Date(now.getTime() - 1000 * 60 * 5),
    lastSeen: new Date(),
    trajectory: [
      { lat: 39.9042, lng: 116.4074, altitude: 100, timestamp: new Date(now.getTime() - 1000 * 60 * 5) },
      { lat: 39.9052, lng: 116.4084, altitude: 110, timestamp: new Date(now.getTime() - 1000 * 60 * 4) },
      { lat: 39.9062, lng: 116.4094, altitude: 115, timestamp: new Date(now.getTime() - 1000 * 60 * 3) },
      { lat: 39.9072, lng: 116.4104, altitude: 120, timestamp: new Date(now.getTime() - 1000 * 60 * 2) },
      { lat: 39.9082, lng: 116.4114, altitude: 120, timestamp: new Date() },
    ],
  },
  {
    id: 'T-002',
    type: '固定翼无人机',
    altitude: 280,
    speed: 25.3,
    direction: 120,
    firstSeen: new Date(now.getTime() - 1000 * 60 * 8),
    lastSeen: new Date(),
    trajectory: [
      { lat: 39.9102, lng: 116.4054, altitude: 250, timestamp: new Date(now.getTime() - 1000 * 60 * 8) },
      { lat: 39.9095, lng: 116.4068, altitude: 260, timestamp: new Date(now.getTime() - 1000 * 60 * 6) },
      { lat: 39.9088, lng: 116.4082, altitude: 270, timestamp: new Date(now.getTime() - 1000 * 60 * 4) },
      { lat: 39.9081, lng: 116.4096, altitude: 280, timestamp: new Date() },
    ],
  },
  {
    id: 'T-003',
    type: '多旋翼无人机',
    altitude: 85,
    speed: 5.2,
    direction: 270,
    firstSeen: new Date(now.getTime() - 1000 * 60 * 3),
    lastSeen: new Date(),
    trajectory: [
      { lat: 39.9060, lng: 116.4120, altitude: 80, timestamp: new Date(now.getTime() - 1000 * 60 * 3) },
      { lat: 39.9060, lng: 116.4110, altitude: 85, timestamp: new Date(now.getTime() - 1000 * 60 * 1) },
      { lat: 39.9060, lng: 116.4100, altitude: 85, timestamp: new Date() },
    ],
  },
];

export const mockAlerts: Alert[] = [
  {
    id: 'A-001',
    targetId: 'T-001',
    deviceId: 'D-001',
    fenceId: 'F-001',
    level: 1,
    status: 'pending',
    alertTime: new Date(now.getTime() - 1000 * 60 * 5),
    position: { lat: 39.9042, lng: 116.4074 },
    description: '目标闯入核心区禁飞空域',
  },
  {
    id: 'A-002',
    targetId: 'T-002',
    deviceId: 'D-002',
    fenceId: 'F-002',
    level: 2,
    status: 'confirmed',
    alertTime: new Date(now.getTime() - 1000 * 60 * 30),
    position: { lat: 39.9102, lng: 116.4054 },
    description: '目标超出限高飞行',
  },
  {
    id: 'A-003',
    targetId: 'T-003',
    deviceId: 'D-001',
    fenceId: 'F-003',
    level: 3,
    status: 'false_positive',
    alertTime: new Date(now.getTime() - 1000 * 60 * 60),
    position: { lat: 39.9060, lng: 116.4120 },
    description: '疑似鸟类活动',
  },
  {
    id: 'A-004',
    targetId: 'T-001',
    deviceId: 'D-003',
    fenceId: 'F-001',
    level: 1,
    status: 'escalated',
    alertTime: new Date(now.getTime() - 1000 * 60 * 120),
    position: { lat: 39.9050, lng: 116.4080 },
    description: '目标在禁飞区停留超过5分钟',
  },
  {
    id: 'A-005',
    targetId: 'T-002',
    deviceId: 'D-001',
    fenceId: 'F-002',
    level: 2,
    status: 'resolved',
    alertTime: new Date(now.getTime() - 1000 * 60 * 180),
    position: { lat: 39.9070, lng: 116.4060 },
    description: '目标已飞离管控区域',
  },
];

export const mockFences: Fence[] = [
  {
    id: 'F-001',
    name: '核心办公区',
    type: 'forbidden',
    maxHeight: 0,
    coordinates: [
      { lat: 39.9030, lng: 116.4050 },
      { lat: 39.9090, lng: 116.4050 },
      { lat: 39.9090, lng: 116.4120 },
      { lat: 39.9030, lng: 116.4120 },
    ],
    alertLevel: 1,
  },
  {
    id: 'F-002',
    name: '展览中心限高区',
    type: 'height_limit',
    maxHeight: 150,
    coordinates: [
      { lat: 39.9000, lng: 116.4000 },
      { lat: 39.9050, lng: 116.4000 },
      { lat: 39.9050, lng: 116.4050 },
      { lat: 39.9000, lng: 116.4050 },
    ],
    alertLevel: 2,
  },
  {
    id: 'F-003',
    name: '临时活动管控区',
    type: 'temporary',
    maxHeight: 100,
    coordinates: [
      { lat: 39.9100, lng: 116.4100 },
      { lat: 39.9130, lng: 116.4100 },
      { lat: 39.9130, lng: 116.4140 },
      { lat: 39.9100, lng: 116.4140 },
    ],
    startTime: new Date(),
    endTime: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 3),
    alertLevel: 3,
  },
];

export const mockDevices: Device[] = [
  {
    id: 'D-001',
    name: '雷达探测器-01',
    type: 'radar',
    position: { lat: 39.9060, lng: 116.4085 },
    coverageRadius: 2000,
    status: 'online',
    lastHeartbeat: new Date(),
  },
  {
    id: 'D-002',
    name: '遥测接收机-01',
    type: 'telemetry',
    position: { lat: 39.9040, lng: 116.4060 },
    coverageRadius: 3000,
    status: 'online',
    lastHeartbeat: new Date(),
  },
  {
    id: 'D-003',
    name: '光电探测-01',
    type: 'photoelectric',
    position: { lat: 39.9080, lng: 116.4100 },
    coverageRadius: 1500,
    status: 'fault',
    lastHeartbeat: new Date(now.getTime() - 1000 * 60 * 30),
  },
  {
    id: 'D-004',
    name: '雷达探测器-02',
    type: 'radar',
    position: { lat: 39.9020, lng: 116.4030 },
    coverageRadius: 2000,
    status: 'offline',
    lastHeartbeat: new Date(now.getTime() - 1000 * 60 * 120),
  },
  {
    id: 'D-005',
    name: '遥测接收机-02',
    type: 'telemetry',
    position: { lat: 39.9100, lng: 116.4070 },
    coverageRadius: 3000,
    status: 'online',
    lastHeartbeat: new Date(),
  },
];

export const mockWorkOrders: WorkOrder[] = [
  {
    id: 'W-001',
    alertId: 'A-001',
    handler: '张三',
    contact: '13800138001',
    status: 'processing',
    measures: {
      check: '已到达现场，发现目标位于办公楼上方盘旋',
      announcement: '已通过广播喊话驱离',
    },
    result: '',
    createdAt: new Date(now.getTime() - 1000 * 60 * 10),
  },
  {
    id: 'W-002',
    alertId: 'A-002',
    handler: '李四',
    contact: '13800138002',
    status: 'completed',
    measures: {
      check: '现场核实为航拍无人机，操作人已找到',
      announcement: '已进行批评教育',
      intercept: '已迫降无人机并暂扣',
    },
    result: '目标已控制，操作人员已登记',
    createdAt: new Date(now.getTime() - 1000 * 60 * 120),
    closedAt: new Date(now.getTime() - 1000 * 60 * 60),
  },
  {
    id: 'W-003',
    alertId: 'A-004',
    handler: '王五',
    contact: '13800138003',
    status: 'pending',
    measures: {},
    result: '',
    createdAt: new Date(now.getTime() - 1000 * 60 * 90),
  },
];

export const mockStatistics: StatisticsData[] = Array.from({ length: 7 }, (_, i) => {
  const date = new Date(now.getTime() - 1000 * 60 * 60 * 24 * (6 - i));
  return {
    date: `${date.getMonth() + 1}/${date.getDate()}`,
    count: Math.floor(Math.random() * 15) + 5,
    level1: Math.floor(Math.random() * 5) + 1,
    level2: Math.floor(Math.random() * 8) + 2,
    level3: Math.floor(Math.random() * 6) + 1,
  };
});

export const mockAreaStats: AreaStats[] = [
  { name: '核心办公区', count: 45, color: '#ff3d3d' },
  { name: '展览中心', count: 28, color: '#ff8a00' },
  { name: '园区北门', count: 15, color: '#ffc700' },
  { name: '园区南门', count: 12, color: '#00d4ff' },
  { name: '其他区域', count: 8, color: '#00ff88' },
];

export const mockTypeStats: TypeStats[] = [
  { type: '多旋翼无人机', count: 68 },
  { type: '固定翼无人机', count: 25 },
  { type: '穿越机', count: 10 },
  { type: '其他', count: 5 },
];

export const mockTimeSlotStats: TimeSlotStats[] = [
  { slot: '00:00-06:00', count: 8 },
  { slot: '06:00-12:00', count: 25 },
  { slot: '12:00-18:00', count: 52 },
  { slot: '18:00-24:00', count: 23 },
];

export const mockSimilarTargets = [
  { id: 'H-001', date: '2024-01-10', type: '多旋翼无人机', altitude: 115, speed: 7.8, similarity: 92 },
  { id: 'H-002', date: '2024-01-08', type: '多旋翼无人机', altitude: 125, speed: 9.2, similarity: 85 },
  { id: 'H-003', date: '2024-01-05', type: '多旋翼无人机', altitude: 118, speed: 8.1, similarity: 78 },
];

export const deviceTypeLabels: Record<string, string> = {
  radar: '雷达探测',
  telemetry: '遥测接收',
  photoelectric: '光电探测',
};

export const alertStatusLabels: Record<string, string> = {
  pending: '待确认',
  confirmed: '已确认',
  false_positive: '误报',
  escalated: '已升级',
  resolved: '已解决',
};

export const fenceTypeLabels: Record<string, string> = {
  forbidden: '禁飞区',
  height_limit: '限高区',
  temporary: '临时管控区',
};

export const workOrderStatusLabels: Record<string, string> = {
  pending: '待处置',
  processing: '处置中',
  completed: '已完成',
  closed: '已关闭',
};

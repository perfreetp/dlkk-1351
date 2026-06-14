import { useState } from 'react';
import { Cpu, Wifi, WifiOff, AlertTriangle, MapPin, Clock, Radio, Satellite, Camera, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { useAppStore } from '@/store';
import MapCanvas from '@/components/Map/MapCanvas';
import { deviceTypeLabels } from '@/data/mockData';
import type { Device, DeviceType, DeviceStatus } from '@/types';

export default function Devices() {
  const { devices, fences, targets } = useAppStore();
  const [showCoverage, setShowCoverage] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [filterType, setFilterType] = useState<DeviceType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<DeviceStatus | 'all'>('all');

  const filteredDevices = devices.filter((d) => {
    if (filterType !== 'all' && d.type !== filterType) return false;
    if (filterStatus !== 'all' && d.status !== filterStatus) return false;
    return true;
  });

  const stats = {
    total: devices.length,
    online: devices.filter((d) => d.status === 'online').length,
    offline: devices.filter((d) => d.status === 'offline').length,
    fault: devices.filter((d) => d.status === 'fault').length,
  };

  const getTypeIcon = (type: DeviceType) => {
    switch (type) {
      case 'radar':
        return <Radio className="w-5 h-5" />;
      case 'telemetry':
        return <Satellite className="w-5 h-5" />;
      case 'photoelectric':
        return <Camera className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: DeviceType) => {
    switch (type) {
      case 'radar':
        return 'text-[#00d4ff]';
      case 'telemetry':
        return 'text-[#00ff88]';
      case 'photoelectric':
        return 'text-[#ff8a00]';
    }
  };

  const getStatusInfo = (status: DeviceStatus) => {
    switch (status) {
      case 'online':
        return { label: '在线', dot: 'status-online', text: 'text-alert-success' };
      case 'offline':
        return { label: '离线', dot: 'status-offline', text: 'text-gray-400' };
      case 'fault':
        return { label: '故障', dot: 'status-fault', text: 'text-alert-1' };
    }
  };

  const formatLastHeartbeat = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}小时前`;
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="h-14 bg-bg-secondary border-b border-border-primary flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-primary" />
            设备管理
          </h2>
          <span className="text-sm text-gray-400">共 {filteredDevices.length} 台设备</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-alert-success animate-pulse" />
              <span className="text-gray-400">在线</span>
              <span className="text-alert-success font-mono font-bold">{stats.online}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-500" />
              <span className="text-gray-400">离线</span>
              <span className="text-gray-400 font-mono font-bold">{stats.offline}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-alert-1 animate-pulse" />
              <span className="text-gray-400">故障</span>
              <span className="text-alert-1 font-mono font-bold">{stats.fault}</span>
            </div>
          </div>

          <button
            onClick={() => setShowCoverage(!showCoverage)}
            className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-sm border transition-all ${
              showCoverage
                ? 'bg-primary/15 text-primary border-primary'
                : 'bg-transparent text-gray-400 border-border-primary hover:border-primary hover:text-primary'
            }`}
          >
            {showCoverage ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            覆盖范围
          </button>

          <button className="btn-primary flex items-center gap-1">
            <RefreshCw className="w-4 h-4" />
            刷新状态
          </button>
        </div>
      </div>

      <div className="h-12 bg-bg-secondary/50 border-b border-border-primary flex items-center px-6 gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">类型:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as DeviceType | 'all')}
            className="input-field w-32 py-1.5"
          >
            <option value="all">全部</option>
            <option value="radar">雷达探测</option>
            <option value="telemetry">遥测接收</option>
            <option value="photoelectric">光电探测</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">状态:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as DeviceStatus | 'all')}
            className="input-field w-32 py-1.5"
          >
            <option value="all">全部</option>
            <option value="online">在线</option>
            <option value="offline">离线</option>
            <option value="fault">故障</option>
          </select>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-96 border-r border-border-primary flex flex-col bg-bg-secondary/50">
          <div className="p-4 border-b border-border-primary">
            <div className="grid grid-cols-2 gap-3">
              <div className="card p-4 text-center">
                <Wifi className="w-8 h-8 text-alert-success mx-auto mb-2" />
                <div className="text-2xl font-mono font-bold text-alert-success">{stats.online}</div>
                <div className="text-xs text-gray-400">在线设备</div>
              </div>
              <div className="card p-4 text-center">
                <WifiOff className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <div className="text-2xl font-mono font-bold text-gray-400">{stats.offline + stats.fault}</div>
                <div className="text-xs text-gray-400">异常设备</div>
              </div>
            </div>

            {stats.fault > 0 && (
              <div className="mt-4 p-3 bg-alert-1/10 border border-alert-1/30 rounded-sm">
                <div className="flex items-center gap-2 text-alert-1">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {stats.fault} 台设备故障，需要处理
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="p-3 border-b border-border-primary">
            <h3 className="text-sm font-semibold text-primary">设备列表</h3>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-2">
            {filteredDevices.map((device) => {
              const statusInfo = getStatusInfo(device.status);
              return (
                <div
                  key={device.id}
                  onClick={() => setSelectedDevice(device)}
                  className={`p-3 rounded-sm border transition-all cursor-pointer ${
                    selectedDevice?.id === device.id
                      ? 'bg-primary/10 border-primary'
                      : 'bg-bg-card border-border-primary hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={getTypeColor(device.type)}>
                        {getTypeIcon(device.type)}
                      </div>
                      <span className="text-white font-medium">{device.name}</span>
                    </div>
                    <div className={`status-dot ${statusInfo.dot}`} />
                  </div>

                  <div className="text-xs text-gray-400 space-y-1">
                    <div className="flex justify-between">
                      <span>类型</span>
                      <span className={`font-medium ${getTypeColor(device.type)}`}>
                        {deviceTypeLabels[device.type]}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>状态</span>
                      <span className={`font-medium ${statusInfo.text}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>覆盖半径</span>
                      <span className="text-gray-300 font-mono">{device.coverageRadius}m</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        位置
                      </span>
                      <span className="text-gray-300 font-mono text-[10px]">
                        {device.position.lat.toFixed(4)}, {device.position.lng.toFixed(4)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        心跳
                      </span>
                      <span className={`font-mono ${device.status === 'online' ? 'text-alert-success' : 'text-gray-500'}`}>
                        {formatLastHeartbeat(device.lastHeartbeat)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="flex-1 relative">
            <MapCanvas
              targets={[]}
              fences={fences}
              devices={devices}
              showCoverage={showCoverage}
              selectedFenceId={null}
            />

            {selectedDevice && (
              <div className="absolute top-4 right-4 w-72 bg-bg-card/95 backdrop-blur border border-border-primary rounded-sm">
                <div className="p-3 border-b border-border-primary">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={getTypeColor(selectedDevice.type)}>
                        {getTypeIcon(selectedDevice.type)}
                      </div>
                      <span className="text-white font-semibold">{selectedDevice.name}</span>
                    </div>
                    <span className={`status-dot ${getStatusInfo(selectedDevice.status).dot}`} />
                  </div>
                </div>
                <div className="p-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">设备ID</span>
                    <span className="font-mono text-primary">{selectedDevice.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">设备类型</span>
                    <span className={getTypeColor(selectedDevice.type)}>
                      {deviceTypeLabels[selectedDevice.type]}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">运行状态</span>
                    <span className={getStatusInfo(selectedDevice.status).text}>
                      {getStatusInfo(selectedDevice.status).label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">覆盖半径</span>
                    <span className="font-mono">{selectedDevice.coverageRadius}m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">经纬度</span>
                    <span className="font-mono text-xs">
                      {selectedDevice.position.lat.toFixed(6)},
                      {selectedDevice.position.lng.toFixed(6)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">最后心跳</span>
                    <span className="font-mono">
                      {selectedDevice.lastHeartbeat.toLocaleString('zh-CN')}
                    </span>
                  </div>
                </div>
                <div className="p-3 border-t border-border-primary">
                  <div className="flex gap-2">
                    {selectedDevice.status === 'fault' && (
                      <button className="btn-primary flex-1 text-xs py-1.5">
                        报修处理
                      </button>
                    )}
                    {selectedDevice.status === 'offline' && (
                      <button className="btn-primary flex-1 text-xs py-1.5">
                        远程重启
                      </button>
                    )}
                    <button className="btn-warning flex-1 text-xs py-1.5">
                      查看详情
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="absolute bottom-4 left-4 bg-bg-card/90 backdrop-blur border border-border-primary rounded-sm p-3">
              <div className="text-xs text-gray-400 space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#00d4ff]" />
                  <span>雷达探测器</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#00ff88]" />
                  <span>遥测接收机</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#ff8a00]" />
                  <span>光电探测器</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full border border-[#00d4ff] bg-[#00d4ff]/10" />
                  <span>覆盖范围</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

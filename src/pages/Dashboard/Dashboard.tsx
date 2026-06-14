import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Cpu, Clock, Maximize2, Bell, Target as TargetIcon, MapPin, Navigation } from 'lucide-react';
import { useAppStore } from '@/store';
import MapCanvas from '@/components/Map/MapCanvas';
import type { Target, Alert } from '@/types';
import { alertStatusLabels } from '@/data/mockData';

export default function Dashboard() {
  const navigate = useNavigate();
  const { targets, alerts, fences, devices, selectedTarget, setSelectedTarget, currentTime, updateTargetPosition, updateCurrentTime } = useAppStore();
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      updateTargetPosition();
      updateCurrentTime();
    }, 1000);
    return () => clearInterval(interval);
  }, [updateTargetPosition, updateCurrentTime]);

  const pendingAlerts = alerts.filter((a) => a.status === 'pending');
  const onlineDevices = devices.filter((d) => d.status === 'online');
  const level1Alerts = alerts.filter((a) => a.level === 1 && a.status !== 'resolved' && a.status !== 'false_positive');
  const level2Alerts = alerts.filter((a) => a.level === 2 && a.status !== 'resolved' && a.status !== 'false_positive');
  const level3Alerts = alerts.filter((a) => a.level === 3 && a.status !== 'resolved' && a.status !== 'false_positive');

  const handleTargetClick = (target: Target) => {
    setSelectedTarget(target);
  };

  const handleViewTargetDetail = (targetId: string) => {
    navigate(`/target/${targetId}`);
  };

  const handleViewAlert = (alert: Alert) => {
    navigate(`/alerts?expand=${alert.id}`);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getAlertForTarget = (targetId: string) => {
    return alerts.find((a) => a.targetId === targetId && a.status !== 'resolved' && a.status !== 'false_positive');
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="h-14 bg-bg-secondary border-b border-border-primary flex items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <h2 className="text-lg font-semibold text-white">态势监控大屏</h2>
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Clock className="w-4 h-4" />
            <span>{formatTime(currentTime)}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-alert-1 animate-pulse" />
              <span className="text-sm text-gray-300">一级告警: <span className="text-alert-1 font-mono font-bold">{level1Alerts.length}</span></span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-alert-2 animate-pulse" />
              <span className="text-sm text-gray-300">二级告警: <span className="text-alert-2 font-mono font-bold">{level2Alerts.length}</span></span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-alert-3 animate-pulse" />
              <span className="text-sm text-gray-300">三级告警: <span className="text-alert-3 font-mono font-bold">{level3Alerts.length}</span></span>
            </div>
          </div>
          
          <div className="h-8 w-px bg-border-primary" />
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-gray-300 text-sm">
              <Cpu className="w-4 h-4 text-primary" />
              <span>设备在线: <span className="text-primary font-mono">{onlineDevices.length}/{devices.length}</span></span>
            </div>
            <div className="flex items-center gap-2 text-gray-300 text-sm">
              <TargetIcon className="w-4 h-4 text-alert-1" />
              <span>追踪目标: <span className="text-alert-1 font-mono">{targets.length}</span></span>
            </div>
          </div>
          
          <button
            onClick={toggleFullscreen}
            className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-sm transition-colors"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div className="flex-1 flex overflow-hidden">
        <div className="w-72 border-r border-border-primary flex flex-col bg-bg-secondary/50">
          <div className="p-3 border-b border-border-primary">
            <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              探测设备状态
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-2">
            {devices.map((device) => (
              <div
                key={device.id}
                className="p-3 bg-bg-card border border-border-primary rounded-sm hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">{device.name}</span>
                  <div className={`status-dot status-${device.status}`} />
                </div>
                <div className="text-xs text-gray-400 space-y-1">
                  <div className="flex justify-between">
                    <span>类型</span>
                    <span className="text-primary">{device.type === 'radar' ? '雷达' : device.type === 'telemetry' ? '遥测' : '光电'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>覆盖半径</span>
                    <span className="text-gray-300 font-mono">{device.coverageRadius}m</span>
                  </div>
                  <div className="flex justify-between">
                    <span>位置</span>
                    <span className="text-gray-300 font-mono text-[10px]">
                      {device.position.lat.toFixed(4)}, {device.position.lng.toFixed(4)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex-1 relative">
          <MapCanvas
            targets={targets}
            fences={fences}
            devices={devices}
            showCoverage={true}
            onTargetClick={handleTargetClick}
            selectedTargetId={selectedTarget?.id}
          />
          
          <div className="absolute bottom-4 left-4 bg-bg-card/90 backdrop-blur border border-border-primary rounded-sm p-3">
            <div className="text-xs text-gray-400 space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-alert-1" />
                <span>疑似目标</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-alert-2" />
                <span>飞行轨迹</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded border border-alert-1 bg-alert-1/20" />
                <span>禁飞区</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded border border-alert-2 bg-alert-2/20" />
                <span>限高区</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span>探测设备</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="w-80 border-l border-border-primary flex flex-col bg-bg-secondary/50">
          <div className="p-3 border-b border-border-primary">
            <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
              <Bell className="w-4 h-4" />
              实时告警信息
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {selectedTarget ? (
              <div className="p-4 border-b border-border-primary">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-white font-semibold">目标 {selectedTarget.id}</h4>
                  <span className={`badge badge-level-${getAlertForTarget(selectedTarget.id)?.level || 1}`}>
                    {getAlertForTarget(selectedTarget.id) ? `告警等级 ${getAlertForTarget(selectedTarget.id)?.level}` : '正常飞行'}
                  </span>
                </div>
                
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-bg-tertiary p-3 rounded-sm">
                      <div className="text-xs text-gray-400 mb-1">飞行高度</div>
                      <div className="text-xl font-mono font-bold text-primary animate-number">
                        {selectedTarget.altitude.toFixed(1)}
                        <span className="text-sm text-gray-400 ml-1">m</span>
                      </div>
                    </div>
                    <div className="bg-bg-tertiary p-3 rounded-sm">
                      <div className="text-xs text-gray-400 mb-1">飞行速度</div>
                      <div className="text-xl font-mono font-bold text-alert-success animate-number">
                        {selectedTarget.speed.toFixed(1)}
                        <span className="text-sm text-gray-400 ml-1">m/s</span>
                      </div>
                    </div>
                    <div className="bg-bg-tertiary p-3 rounded-sm">
                      <div className="text-xs text-gray-400 mb-1">飞行方向</div>
                      <div className="text-xl font-mono font-bold text-alert-warning animate-number flex items-center gap-2">
                        <Navigation className="w-4 h-4" style={{ transform: `rotate(${selectedTarget.direction}deg)` }} />
                        {selectedTarget.direction.toFixed(0)}°
                      </div>
                    </div>
                    <div className="bg-bg-tertiary p-3 rounded-sm">
                      <div className="text-xs text-gray-400 mb-1">目标类型</div>
                      <div className="text-base font-semibold text-white mt-2">
                        {selectedTarget.type}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-bg-tertiary p-3 rounded-sm">
                    <div className="text-xs text-gray-400 mb-2">当前位置</div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-alert-1" />
                      <span className="font-mono">
                        {selectedTarget.trajectory[selectedTarget.trajectory.length - 1].lat.toFixed(6)},
                        {selectedTarget.trajectory[selectedTarget.trajectory.length - 1].lng.toFixed(6)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-bg-tertiary p-3 rounded-sm">
                      <div className="text-xs text-gray-400 mb-1">首次发现</div>
                      <div className="text-sm font-mono text-gray-300">
                        {selectedTarget.firstSeen.toLocaleTimeString('zh-CN')}
                      </div>
                    </div>
                    <div className="bg-bg-tertiary p-3 rounded-sm">
                      <div className="text-xs text-gray-400 mb-1">持续时间</div>
                      <div className="text-sm font-mono text-alert-success">
                        {Math.floor((Date.now() - selectedTarget.firstSeen.getTime()) / 1000)}s
                      </div>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => handleViewTargetDetail(selectedTarget.id)}
                  className="w-full mt-4 btn-primary"
                >
                  查看目标详情
                </button>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <TargetIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>点击地图上的目标查看详情</p>
              </div>
            )}
            
            <div className="p-3 border-t border-border-primary">
              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-alert-1" />
                待处理告警 ({pendingAlerts.length})
              </h4>
              <div className="space-y-2">
                {pendingAlerts.slice(0, 5).map((alert) => (
                  <div
                    key={alert.id}
                    onClick={() => handleViewAlert(alert)}
                    className="p-3 bg-bg-tertiary rounded-sm border-l-2 border-alert-1 cursor-pointer hover:bg-bg-card transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-white">{alert.id}</span>
                      <span className={`badge badge-level-${alert.level}`}>
                        {alert.level === 1 ? '紧急' : alert.level === 2 ? '重要' : '一般'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">{alert.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {alert.alertTime.toLocaleTimeString('zh-CN')}
                    </p>
                  </div>
                ))}
                {pendingAlerts.length === 0 && (
                  <div className="text-center text-gray-500 py-4 text-sm">
                    暂无待处理告警
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="h-10 bg-bg-secondary border-t border-border-primary overflow-hidden relative">
        <div className="flex items-center h-full px-4 bg-alert-1/10 border-l-4 border-alert-1">
          <Bell className="w-4 h-4 text-alert-1 mr-3 animate-pulse" />
          <span className="text-alert-1 font-medium text-sm mr-4">实时告警播报:</span>
          <div className="flex-1 overflow-hidden">
            <div className="whitespace-nowrap animate-marquee">
              {alerts.filter(a => a.status !== 'false_positive').map((alert, i) => (
                <span key={alert.id} className="mx-8">
                  [{alert.alertTime.toLocaleTimeString('zh-CN')}] {alert.id} - {alert.description}
                  <span className={`ml-2 text-alert-${alert.level}`}>
                    (等级 {alert.level} - {alertStatusLabels[alert.status]})
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

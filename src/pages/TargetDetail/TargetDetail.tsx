import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Target, MapPin, Navigation, Clock, Calendar, AlertTriangle, History, Play, Pause, RotateCcw, Gauge, Wind, Compass, SkipBack, SkipForward, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppStore } from '@/store';
import MapCanvas from '@/components/Map/MapCanvas';
import { mockSimilarTargets } from '@/data/mockData';

export default function TargetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { targets, fences, devices, alerts, workOrders } = useAppStore();
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const playIntervalRef = useRef<number | null>(null);

  const target = targets.find((t) => t.id === id);
  const targetAlerts = alerts.filter((a) => a.targetId === id);
  const targetWorkOrders = useMemo(() => {
    const alertIds = targetAlerts.map((a) => a.id);
    return workOrders.filter((w) => alertIds.includes(w.alertId));
  }, [workOrders, targetAlerts]);

  const trajectory = target?.trajectory || [];
  const trajectoryLength = trajectory.length;
  const totalDuration = target ? Math.floor((target.lastSeen.getTime() - target.firstSeen.getTime()) / 1000) : 0;

  const currentPlaybackPoint = useMemo(() => {
    if (trajectoryLength === 0) return null;
    const idx = Math.min(playbackIndex, trajectoryLength - 1);
    return trajectory[idx];
  }, [playbackIndex, trajectory, trajectoryLength]);

  const elapsedSeconds = useMemo(() => {
    if (trajectoryLength <= 1) return 0;
    return Math.floor((playbackIndex / (trajectoryLength - 1)) * totalDuration);
  }, [playbackIndex, trajectoryLength, totalDuration]);

  const interpolatedData = useMemo(() => {
    if (!target || trajectoryLength === 0) {
      return { altitude: 0, speed: 0, direction: 0, lat: 0, lng: 0 };
    }
    const idx = Math.min(playbackIndex, trajectoryLength - 1);
    const point = trajectory[idx];

    let direction = target.direction;
    let speed = target.speed;
    if (idx > 0) {
      const prevPoint = trajectory[idx - 1];
      const dx = point.lng - prevPoint.lng;
      const dy = point.lat - prevPoint.lat;
      direction = Math.atan2(dx, dy) * (180 / Math.PI);
      if (direction < 0) direction += 360;
      const distMeters = Math.sqrt(dx * dx + dy * dy) * 111000;
      const timeDiff = Math.max(1, (point.timestamp.getTime() - prevPoint.timestamp.getTime()) / 1000);
      speed = Math.max(0.1, distMeters / timeDiff);
    }

    return {
      altitude: point.altitude,
      speed,
      direction,
      lat: point.lat,
      lng: point.lng,
    };
  }, [target, playbackIndex, trajectory, trajectoryLength]);

  const currentTimestamp = useMemo(() => {
    if (!currentPlaybackPoint) return target?.firstSeen || new Date();
    return currentPlaybackPoint.timestamp;
  }, [currentPlaybackPoint, target]);

  const playbackIndexMap = useMemo(() => {
    if (!target) return {};
    return { [target.id]: playbackIndex };
  }, [target, playbackIndex]);

  const togglePlay = useCallback(() => {
    setPlaybackIndex((prev) => {
      if (prev >= trajectoryLength - 1) {
        return 0;
      }
      return prev;
    });
    setIsPlaying((prev) => !prev);
  }, [trajectoryLength]);

  const resetPlayback = useCallback(() => {
    setIsPlaying(false);
    setPlaybackIndex(0);
  }, []);

  const skipBackward = useCallback(() => {
    setPlaybackIndex((prev) => Math.max(0, prev - Math.ceil(trajectoryLength * 0.1)));
  }, [trajectoryLength]);

  const skipForward = useCallback(() => {
    setPlaybackIndex((prev) => Math.min(trajectoryLength - 1, prev + Math.ceil(trajectoryLength * 0.1)));
  }, [trajectoryLength]);

  const stepBackward = useCallback(() => {
    setPlaybackIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const stepForward = useCallback(() => {
    setPlaybackIndex((prev) => Math.min(trajectoryLength - 1, prev + 1));
  }, [trajectoryLength]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlaybackIndex(Number(e.target.value));
  };

  useEffect(() => {
    if (isPlaying && trajectoryLength > 1) {
      const interval = Math.max(50, 1000 / (playbackSpeed * 5));
      playIntervalRef.current = window.setInterval(() => {
        setPlaybackIndex((prev) => {
          if (prev >= trajectoryLength - 1) {
            setIsPlaying(false);
            return trajectoryLength - 1;
          }
          return prev + 1;
        });
      }, interval);
    }

    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
    };
  }, [isPlaying, playbackSpeed, trajectoryLength]);

  useEffect(() => {
    if (target) {
      setPlaybackIndex(trajectoryLength - 1);
    }
  }, [id, target, trajectoryLength]);

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (!target) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <Target className="w-16 h-16 mb-4 opacity-20" />
        <p className="mb-4">未找到目标 {id}</p>
        <button onClick={() => navigate('/dashboard')} className="btn-primary">
          返回态势大屏
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="h-14 bg-bg-secondary border-b border-border-primary flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-sm transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-alert-1" />
            目标详情 - {target.id}
          </h2>
          <span className={`badge ${isPlaying ? 'badge-level-3' : 'badge-level-1'}`}>
            {isPlaying ? `播放中 ${playbackSpeed}x` : playbackIndex === 0 ? '待播放' : '已暂停'}
          </span>
          {targetWorkOrders.length > 0 && (
            <span className="badge badge-info">
              关联工单 {targetWorkOrders.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-400">播放速度:</span>
          {[0.5, 1, 2, 4].map((speed) => (
            <button
              key={speed}
              onClick={() => setPlaybackSpeed(speed)}
              className={`px-2 py-1 rounded text-xs font-mono transition-all ${
                playbackSpeed === speed
                  ? 'bg-primary text-white'
                  : 'bg-bg-tertiary text-gray-400 hover:text-white hover:bg-bg-card'
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col">
          <div className="h-[400px] border-b border-border-primary relative">
            <MapCanvas
              targets={[target]}
              fences={fences}
              devices={devices}
              showCoverage={false}
              selectedTargetId={target.id}
              playbackPointIndex={playbackIndexMap}
            />
            <div className="absolute top-3 left-3 bg-bg-card/90 backdrop-blur border border-border-primary rounded-sm p-3">
              <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                播放时刻
              </div>
              <div className="text-lg font-mono text-primary">
                {currentTimestamp.toLocaleTimeString('zh-CN')}
              </div>
              <div className="text-xs text-gray-500">
                {currentTimestamp.toLocaleDateString('zh-CN')}
              </div>
            </div>

            <div className="absolute top-3 right-3 bg-bg-card/90 backdrop-blur border border-border-primary rounded-sm p-3">
              <div className="text-xs text-gray-400 mb-1">当前位置</div>
              <div className="text-sm font-mono text-white">
                {interpolatedData.lat.toFixed(6)}, {interpolatedData.lng.toFixed(6)}
              </div>
              <div className="text-xs text-primary font-mono mt-1">
                {playbackIndex + 1} / {trajectoryLength} 个轨迹点
              </div>
              {playbackIndex >= trajectoryLength - 1 && !isPlaying && trajectoryLength > 1 && (
                <div className="text-xs text-alert-warning mt-2 flex items-center gap-1">
                  <RotateCcw className="w-3 h-3" />
                  播放结束，点击播放从头开始
                </div>
              )}
            </div>
          </div>

          <div className="p-4 border-t border-border-primary bg-bg-secondary/50">
            <div className="flex items-center gap-3 mb-3 justify-center">
              <button
                onClick={resetPlayback}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-sm transition-colors"
                title="重置播放"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={skipBackward}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-sm transition-colors"
                title="后退10%"
              >
                <SkipBack className="w-4 h-4" />
              </button>
              <button
                onClick={stepBackward}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-sm transition-colors"
                title="上一帧"
                disabled={playbackIndex <= 0}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={togglePlay}
                className={`p-3 rounded-full transition-colors ${
                  isPlaying
                    ? 'bg-alert-2 hover:bg-alert-2/80 text-white'
                    : 'bg-primary hover:bg-primary/80 text-white'
                }`}
                title={isPlaying ? '暂停' : '播放'}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
              <button
                onClick={stepForward}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-sm transition-colors"
                title="下一帧"
                disabled={playbackIndex >= trajectoryLength - 1}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={skipForward}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-sm transition-colors"
                title="前进10%"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400 font-mono w-16 text-right">
                {formatDuration(elapsedSeconds)}
              </span>
              <div className="flex-1 relative">
                <input
                  type="range"
                  min="0"
                  max={trajectoryLength - 1}
                  value={playbackIndex}
                  onChange={handleSliderChange}
                  className="w-full h-2 bg-bg-tertiary rounded-lg appearance-none cursor-pointer accent-primary"
                  style={{
                    background: `linear-gradient(to right, #00d4ff 0%, #00d4ff ${(playbackIndex / (trajectoryLength - 1)) * 100}%, #152a45 ${(playbackIndex / (trajectoryLength - 1)) * 100}%, #152a45 100%)`,
                  }}
                />
                <div className="absolute top-4 left-0 w-full flex justify-between pointer-events-none">
                  {Array.from({ length: 5 }, (_, i) => {
                    const pointIdx = Math.floor((i / 4) * (trajectoryLength - 1));
                    const pointTime = trajectory[pointIdx]?.timestamp;
                    return (
                      <div key={i} className="text-[10px] text-gray-500 font-mono">
                        {pointTime ? pointTime.toLocaleTimeString('zh-CN').slice(0, 5) : ''}
                      </div>
                    );
                  })}
                </div>
              </div>
              <span className="text-sm text-gray-400 font-mono w-16">
                {formatDuration(totalDuration)}
              </span>
            </div>
            <p className="text-xs text-gray-500 text-center mt-4">
              点击播放按钮查看历史轨迹回放，拖动滑块可快速定位到任意时刻
            </p>
          </div>
        </div>

        <div className="w-96 border-l border-border-primary overflow-y-auto scrollbar-thin">
          <div className="p-4 border-b border-border-primary">
            <h3 className="text-sm font-semibold text-primary mb-4 flex items-center gap-2">
              <Gauge className="w-4 h-4" />
              飞行参数 (实时联动)
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="card p-4">
                <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
                  <Navigation className="w-3 h-3" />
                  飞行高度
                </div>
                <div className="text-2xl font-mono font-bold text-primary animate-number">
                  {interpolatedData.altitude.toFixed(1)}
                  <span className="text-sm text-gray-400 ml-1">m</span>
                </div>
              </div>
              <div className="card p-4">
                <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
                  <Wind className="w-3 h-3" />
                  飞行速度
                </div>
                <div className="text-2xl font-mono font-bold text-alert-success animate-number">
                  {interpolatedData.speed.toFixed(1)}
                  <span className="text-sm text-gray-400 ml-1">m/s</span>
                </div>
              </div>
              <div className="card p-4">
                <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
                  <Compass className="w-3 h-3" />
                  飞行方向
                </div>
                <div className="text-2xl font-mono font-bold text-alert-warning flex items-center gap-2">
                  <Navigation
                    className="w-5 h-5 transition-transform duration-300"
                    style={{ transform: `rotate(${interpolatedData.direction}deg)` }}
                  />
                  {interpolatedData.direction.toFixed(0)}°
                </div>
              </div>
              <div className="card p-4">
                <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
                  <Target className="w-3 h-3" />
                  目标类型
                </div>
                <div className="text-lg font-semibold text-white mt-2">
                  {target.type}
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 border-b border-border-primary">
            <h3 className="text-sm font-semibold text-primary mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              位置信息
            </h3>
            <div className="space-y-3">
              <div className="bg-bg-tertiary p-3 rounded-sm">
                <div className="text-xs text-gray-400 mb-1">播放时刻位置</div>
                <div className="font-mono text-white">
                  {interpolatedData.lat.toFixed(6)}, {interpolatedData.lng.toFixed(6)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-bg-tertiary p-3 rounded-sm">
                  <div className="text-xs text-gray-400 mb-1">纬度</div>
                  <div className="font-mono text-white text-sm">
                    {interpolatedData.lat.toFixed(6)}
                  </div>
                </div>
                <div className="bg-bg-tertiary p-3 rounded-sm">
                  <div className="text-xs text-gray-400 mb-1">经度</div>
                  <div className="font-mono text-white text-sm">
                    {interpolatedData.lng.toFixed(6)}
                  </div>
                </div>
                <div className="bg-bg-tertiary p-3 rounded-sm col-span-2">
                  <div className="text-xs text-gray-400 mb-1">点高度</div>
                  <div className="font-mono text-white text-sm">
                    {interpolatedData.altitude.toFixed(2)} m
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 border-b border-border-primary">
            <h3 className="text-sm font-semibold text-primary mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              时间信息
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">首次发现</span>
                <span className="font-mono text-white text-sm">
                  {target.firstSeen.toLocaleString('zh-CN')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">最后更新</span>
                <span className="font-mono text-white text-sm">
                  {target.lastSeen.toLocaleString('zh-CN')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">播放进度</span>
                <span className="font-mono text-primary text-sm">
                  {formatDuration(elapsedSeconds)} / {formatDuration(totalDuration)}
                </span>
              </div>
              <div className="w-full bg-bg-secondary rounded-full h-2 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-200"
                  style={{ width: `${totalDuration > 0 ? (elapsedSeconds / totalDuration) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          {targetAlerts.length > 0 && (
            <div className="p-4 border-b border-border-primary">
              <h3 className="text-sm font-semibold text-primary mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                关联告警
              </h3>
              <div className="space-y-2">
                {targetAlerts.map((alert) => {
                  const relatedOrders = workOrders.filter((w) => w.alertId === alert.id);
                  return (
                    <div key={alert.id} className="bg-bg-tertiary p-3 rounded-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-primary">{alert.id}</span>
                        <span className={`badge badge-level-${alert.level}`}>
                          等级 {alert.level}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">{alert.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {alert.alertTime.toLocaleString('zh-CN')}
                      </p>
                      {relatedOrders.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-border-primary flex flex-wrap gap-1">
                          {relatedOrders.map((wo) => (
                            <span
                              key={wo.id}
                              onClick={() => navigate('/workorders')}
                              className="text-xs badge badge-info cursor-pointer"
                            >
                              工单 {wo.id}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="p-4">
            <h3 className="text-sm font-semibold text-primary mb-4 flex items-center gap-2">
              <History className="w-4 h-4" />
              相似历史目标
            </h3>
            <div className="space-y-2">
              {mockSimilarTargets.map((item) => (
                <div key={item.id} className="bg-bg-tertiary p-3 rounded-sm hover:bg-bg-card transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-white">{item.id}</span>
                    <span className="text-xs text-primary">相似度 {item.similarity}%</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500">高度</span>
                      <div className="font-mono text-gray-300">{item.altitude}m</div>
                    </div>
                    <div>
                      <span className="text-gray-500">速度</span>
                      <div className="font-mono text-gray-300">{item.speed}m/s</div>
                    </div>
                    <div>
                      <span className="text-gray-500">日期</span>
                      <div className="font-mono text-gray-300">{item.date}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

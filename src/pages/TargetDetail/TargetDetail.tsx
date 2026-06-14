import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Target, MapPin, Navigation, Clock, Calendar, AlertTriangle, History, Play, Pause, RotateCcw, Gauge, Wind, Compass } from 'lucide-react';
import { useAppStore } from '@/store';
import MapCanvas from '@/components/Map/MapCanvas';
import { mockSimilarTargets } from '@/data/mockData';
import { useState } from 'react';

export default function TargetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { targets, fences, devices, alerts } = useAppStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);

  const target = targets.find((t) => t.id === id);
  const targetAlerts = alerts.filter((a) => a.targetId === id);

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

  const currentPos = target.trajectory[target.trajectory.length - 1];
  const duration = Math.floor((target.lastSeen.getTime() - target.firstSeen.getTime()) / 1000);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}分${secs}秒`;
  };

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
          <span className={`badge badge-level-1`}>实时追踪中</span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col">
          <div className="h-[400px] border-b border-border-primary">
            <MapCanvas
              targets={[target]}
              fences={fences}
              devices={devices}
              showCoverage={false}
              selectedTargetId={target.id}
            />
          </div>

          <div className="p-4 border-t border-border-primary bg-bg-secondary/50">
            <div className="flex items-center gap-4 mb-3">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-sm transition-colors"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-sm transition-colors">
                <RotateCcw className="w-4 h-4" />
              </button>
              <div className="flex-1">
                <input
                  type="range"
                  min="0"
                  max={target.trajectory.length - 1}
                  value={playbackTime}
                  onChange={(e) => setPlaybackTime(Number(e.target.value))}
                  className="w-full h-1 bg-border-primary rounded appearance-none cursor-pointer accent-primary"
                />
              </div>
              <span className="text-sm text-gray-400 font-mono">
                {formatDuration(Math.floor((playbackTime / target.trajectory.length) * duration))} / {formatDuration(duration)}
              </span>
            </div>
            <p className="text-xs text-gray-500">拖动滑块或点击播放查看历史轨迹</p>
          </div>
        </div>

        <div className="w-96 border-l border-border-primary overflow-y-auto scrollbar-thin">
          <div className="p-4 border-b border-border-primary">
            <h3 className="text-sm font-semibold text-primary mb-4 flex items-center gap-2">
              <Gauge className="w-4 h-4" />
              飞行参数
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="card p-4">
                <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
                  <Navigation className="w-3 h-3" />
                  飞行高度
                </div>
                <div className="text-2xl font-mono font-bold text-primary">
                  {target.altitude.toFixed(1)}
                  <span className="text-sm text-gray-400 ml-1">m</span>
                </div>
              </div>
              <div className="card p-4">
                <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
                  <Wind className="w-3 h-3" />
                  飞行速度
                </div>
                <div className="text-2xl font-mono font-bold text-alert-success">
                  {target.speed.toFixed(1)}
                  <span className="text-sm text-gray-400 ml-1">m/s</span>
                </div>
              </div>
              <div className="card p-4">
                <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
                  <Compass className="w-3 h-3" />
                  飞行方向
                </div>
                <div className="text-2xl font-mono font-bold text-alert-warning flex items-center gap-2">
                  <Navigation className="w-5 h-5" style={{ transform: `rotate(${target.direction}deg)` }} />
                  {target.direction.toFixed(0)}°
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
                <div className="text-xs text-gray-400 mb-1">当前位置</div>
                <div className="font-mono text-white">
                  {currentPos.lat.toFixed(6)}, {currentPos.lng.toFixed(6)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-bg-tertiary p-3 rounded-sm">
                  <div className="text-xs text-gray-400 mb-1">纬度</div>
                  <div className="font-mono text-white text-sm">{currentPos.lat.toFixed(6)}</div>
                </div>
                <div className="bg-bg-tertiary p-3 rounded-sm">
                  <div className="text-xs text-gray-400 mb-1">经度</div>
                  <div className="font-mono text-white text-sm">{currentPos.lng.toFixed(6)}</div>
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
                <span className="text-sm text-gray-400">持续时间</span>
                <span className="font-mono text-alert-success text-sm">
                  {formatDuration(duration)}
                </span>
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
                {targetAlerts.map((alert) => (
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
                  </div>
                ))}
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

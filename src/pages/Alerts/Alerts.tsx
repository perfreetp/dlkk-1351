import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Filter, Check, XCircle, ArrowUpRight, Search, Calendar, MapPin, Clock } from 'lucide-react';
import { useAppStore } from '@/store';
import type { AlertLevel, AlertStatus } from '@/types';
import { alertStatusLabels } from '@/data/mockData';

export default function Alerts() {
  const navigate = useNavigate();
  const { alerts, devices, fences, updateAlertStatus } = useAppStore();
  const [selectedLevel, setSelectedLevel] = useState<AlertLevel | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<AlertStatus | 'all'>('all');
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      if (selectedLevel !== 'all' && alert.level !== selectedLevel) return false;
      if (selectedStatus !== 'all' && alert.status !== selectedStatus) return false;
      if (searchText && !alert.id.includes(searchText) && !alert.description.includes(searchText)) return false;
      return true;
    });
  }, [alerts, selectedLevel, selectedStatus, searchText]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredAlerts.map((a) => a.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelect = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    }
  };

  const handleBatchConfirm = () => {
    selectedIds.forEach((id) => updateAlertStatus(id, 'confirmed'));
    setSelectedIds([]);
  };

  const handleBatchFalsePositive = () => {
    selectedIds.forEach((id) => updateAlertStatus(id, 'false_positive'));
    setSelectedIds([]);
  };

  const getDeviceName = (deviceId: string) => {
    return devices.find((d) => d.id === deviceId)?.name || deviceId;
  };

  const getFenceName = (fenceId: string) => {
    return fences.find((f) => f.id === fenceId)?.name || fenceId;
  };

  const getStatusBadge = (status: AlertStatus) => {
    const styles: Record<AlertStatus, string> = {
      pending: 'bg-alert-1/20 text-alert-1 border-alert-1/50',
      confirmed: 'bg-alert-2/20 text-alert-2 border-alert-2/50',
      false_positive: 'bg-gray-500/20 text-gray-400 border-gray-500/50',
      escalated: 'bg-alert-3/20 text-alert-3 border-alert-3/50',
      resolved: 'bg-alert-success/20 text-alert-success border-alert-success/50',
    };
    return (
      <span className={`badge border ${styles[status]}`}>
        {alertStatusLabels[status]}
      </span>
    );
  };

  const stats = useMemo(() => ({
    total: alerts.length,
    pending: alerts.filter((a) => a.status === 'pending').length,
    confirmed: alerts.filter((a) => a.status === 'confirmed').length,
    resolved: alerts.filter((a) => a.status === 'resolved').length,
    falsePositive: alerts.filter((a) => a.status === 'false_positive').length,
  }), [alerts]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="h-14 bg-bg-secondary border-b border-border-primary flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-primary" />
            告警列表
          </h2>
          <span className="text-sm text-gray-400">共 {filteredAlerts.length} 条记录</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-alert-1" />
              <span className="text-gray-400">待确认</span>
              <span className="text-alert-1 font-mono font-bold">{stats.pending}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-alert-2" />
              <span className="text-gray-400">已确认</span>
              <span className="text-alert-2 font-mono font-bold">{stats.confirmed}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-alert-success" />
              <span className="text-gray-400">已解决</span>
              <span className="text-alert-success font-mono font-bold">{stats.resolved}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-4 border-b border-border-primary bg-bg-secondary/50">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">筛选:</span>
          </div>
          
          <div className="relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="搜索告警ID或描述..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="input-field pl-9 w-64"
            />
          </div>
          
          <div className="relative">
            <Calendar className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="date"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="input-field pl-9 w-44"
            />
          </div>
          
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value as AlertLevel | 'all')}
            className="input-field w-36"
          >
            <option value="all">全部等级</option>
            <option value="1">一级 (紧急)</option>
            <option value="2">二级 (重要)</option>
            <option value="3">三级 (一般)</option>
          </select>
          
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as AlertStatus | 'all')}
            className="input-field w-36"
          >
            <option value="all">全部状态</option>
            <option value="pending">待确认</option>
            <option value="confirmed">已确认</option>
            <option value="false_positive">误报</option>
            <option value="escalated">已升级</option>
            <option value="resolved">已解决</option>
          </select>
          
          <div className="flex-1" />
          
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">已选 {selectedIds.length} 项:</span>
              <button onClick={handleBatchConfirm} className="btn-success flex items-center gap-1">
                <Check className="w-4 h-4" />
                批量确认
              </button>
              <button onClick={handleBatchFalsePositive} className="btn-warning flex items-center gap-1">
                <XCircle className="w-4 h-4" />
                批量误报
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-auto scrollbar-thin">
        <table className="w-full">
          <thead className="sticky top-0 bg-bg-secondary z-10">
            <tr>
              <th className="table-header w-12">
                <input
                  type="checkbox"
                  checked={selectedIds.length === filteredAlerts.length && filteredAlerts.length > 0}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded border-border-primary bg-bg-tertiary text-primary focus:ring-primary"
                />
              </th>
              <th className="table-header">告警ID</th>
              <th className="table-header">告警等级</th>
              <th className="table-header">目标ID</th>
              <th className="table-header">触发围栏</th>
              <th className="table-header">探测设备</th>
              <th className="table-header">位置</th>
              <th className="table-header">告警时间</th>
              <th className="table-header">状态</th>
              <th className="table-header">描述</th>
              <th className="table-header text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredAlerts.map((alert) => (
              <tr key={alert.id} className="table-row">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(alert.id)}
                    onChange={(e) => handleSelect(alert.id, e.target.checked)}
                    className="w-4 h-4 rounded border-border-primary bg-bg-tertiary text-primary focus:ring-primary"
                  />
                </td>
                <td className="px-4 py-3">
                  <span className="font-mono text-primary">{alert.id}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`badge badge-level-${alert.level}`}>
                    {alert.level === 1 ? '一级 · 紧急' : alert.level === 2 ? '二级 · 重要' : '三级 · 一般'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => navigate(`/target/${alert.targetId}`)}
                    className="font-mono text-primary hover:underline flex items-center gap-1"
                  >
                    {alert.targetId}
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </td>
                <td className="px-4 py-3 text-gray-300">{getFenceName(alert.fenceId)}</td>
                <td className="px-4 py-3 text-gray-300">{getDeviceName(alert.deviceId)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 text-sm text-gray-400">
                    <MapPin className="w-3 h-3" />
                    <span className="font-mono">
                      {alert.position.lat.toFixed(4)}, {alert.position.lng.toFixed(4)}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 text-sm text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span>{alert.alertTime.toLocaleString('zh-CN')}</span>
                  </div>
                </td>
                <td className="px-4 py-3">{getStatusBadge(alert.status)}</td>
                <td className="px-4 py-3 text-gray-400 text-sm max-w-xs truncate">{alert.description}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    {alert.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateAlertStatus(alert.id, 'confirmed')}
                          className="p-1.5 text-alert-success hover:bg-alert-success/10 rounded-sm transition-colors"
                          title="确认告警"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => updateAlertStatus(alert.id, 'false_positive')}
                          className="p-1.5 text-gray-400 hover:bg-gray-400/10 rounded-sm transition-colors"
                          title="标记误报"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            updateAlertStatus(alert.id, 'escalated');
                            navigate(`/workorders?alertId=${alert.id}`);
                          }}
                          className="p-1.5 text-alert-warning hover:bg-alert-warning/10 rounded-sm transition-colors"
                          title="升级处置"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {alert.status === 'confirmed' && (
                      <button
                        onClick={() => navigate(`/workorders?alertId=${alert.id}`)}
                        className="btn-primary text-xs py-1 px-2"
                      >
                        创建工单
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredAlerts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <AlertTriangle className="w-16 h-16 mb-4 opacity-20" />
            <p>暂无符合条件的告警记录</p>
          </div>
        )}
      </div>
    </div>
  );
}

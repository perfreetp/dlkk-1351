import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History,
  ArrowLeft,
  AlertTriangle,
  Target,
  Shield,
  ClipboardList,
  Clock,
  Check,
  XCircle,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  FileText,
  Cpu,
  Filter,
  ChevronLeft,
  ChevronRight,
  Download,
  CalendarDays,
  Gauge,
  CheckCircle2,
} from 'lucide-react';
import { useAppStore } from '@/store';
import type { Alert, WorkOrder } from '@/types';
import { alertStatusLabels, fenceTypeLabels } from '@/data/mockData';
import { isSameDay, toDateInputValue } from '@/lib/utils';

interface TimelineEvent {
  id: string;
  time: Date;
  type: 'alert_created' | 'alert_confirmed' | 'alert_false_positive' | 'alert_escalated' | 'alert_resolved' |
        'order_created' | 'order_processing' | 'order_completed' | 'order_closed' |
        'measure_check' | 'measure_announcement' | 'measure_intercept';
  title: string;
  description?: string;
  level?: number;
}

export default function Review() {
  const navigate = useNavigate();
  const { alerts, targets, fences, devices, workOrders } = useAppStore();
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(alerts[0]?.id || null);
  const [expanded, setExpanded] = useState(true);
  const [filterDate, setFilterDate] = useState<string>('');
  const [filterLevel, setFilterLevel] = useState<'' | '1' | '2' | '3'>('');
  const [filterResult, setFilterResult] = useState<'' | 'pending' | 'active' | 'resolved' | 'false_positive'>('');
  const [exportingReport, setExportingReport] = useState(false);

  const sortedFilteredAlerts = useMemo(() => {
    let list = [...alerts].sort((a, b) => b.alertTime.getTime() - a.alertTime.getTime());
    if (filterDate) {
      const fd = new Date(filterDate);
      list = list.filter((a) => isSameDay(a.alertTime, fd));
    }
    if (filterLevel) {
      list = list.filter((a) => a.level === Number(filterLevel));
    }
    if (filterResult) {
      list = list.filter((a) => {
        if (filterResult === 'pending') return a.status === 'pending';
        if (filterResult === 'active') return a.status === 'confirmed' || a.status === 'escalated';
        if (filterResult === 'resolved') return a.status === 'resolved';
        if (filterResult === 'false_positive') return a.status === 'false_positive';
        return true;
      });
    }
    return list;
  }, [alerts, filterDate, filterLevel, filterResult]);

  const currentIndex = useMemo(() => {
    if (!selectedAlertId) return -1;
    return sortedFilteredAlerts.findIndex((a) => a.id === selectedAlertId);
  }, [sortedFilteredAlerts, selectedAlertId]);

  const goPrev = () => {
    if (currentIndex > 0) setSelectedAlertId(sortedFilteredAlerts[currentIndex - 1].id);
  };
  const goNext = () => {
    if (currentIndex >= 0 && currentIndex < sortedFilteredAlerts.length - 1) {
      setSelectedAlertId(sortedFilteredAlerts[currentIndex + 1].id);
    }
  };

  const selectedAlert = useMemo(() => {
    return alerts.find((a) => a.id === selectedAlertId) || null;
  }, [alerts, selectedAlertId]);

  const relatedTarget = useMemo(() => {
    return selectedAlert ? targets.find((t) => t.id === selectedAlert.targetId) : null;
  }, [selectedAlert, targets]);

  const relatedFence = useMemo(() => {
    return selectedAlert ? fences.find((f) => f.id === selectedAlert.fenceId) : null;
  }, [selectedAlert, fences]);

  const relatedDevice = useMemo(() => {
    return selectedAlert ? devices.find((d) => d.id === selectedAlert.deviceId) : null;
  }, [selectedAlert, devices]);

  const relatedOrders = useMemo(() => {
    return selectedAlert ? workOrders.filter((w) => w.alertId === selectedAlert.id) : [];
  }, [selectedAlert, workOrders]);

  const timeline = useMemo<TimelineEvent[]>(() => {
    if (!selectedAlert) return [];
    const events: TimelineEvent[] = [];

    events.push({
      id: `alert-${selectedAlert.id}`,
      time: selectedAlert.alertTime,
      type: 'alert_created',
      title: '告警产生',
      description: `${selectedAlert.description}\n位置: ${selectedAlert.position.lat.toFixed(4)}, ${selectedAlert.position.lng.toFixed(4)}`,
      level: selectedAlert.level,
    });

    if (selectedAlert.status === 'confirmed' || selectedAlert.status === 'escalated' || selectedAlert.status === 'resolved') {
      events.push({
        id: `alert-confirm-${selectedAlert.id}`,
        time: new Date(selectedAlert.alertTime.getTime() + 60 * 1000),
        type: 'alert_confirmed',
        title: '告警确认',
        description: '值班人员已确认告警为真实目标',
      });
    }

    if (selectedAlert.status === 'false_positive') {
      events.push({
        id: `alert-fp-${selectedAlert.id}`,
        time: new Date(selectedAlert.alertTime.getTime() + 60 * 1000),
        type: 'alert_false_positive',
        title: '标记误报',
        description: '值班人员判定为误报，告警已关闭',
      });
    }

    if (selectedAlert.status === 'escalated' || selectedAlert.status === 'resolved') {
      events.push({
        id: `alert-escalate-${selectedAlert.id}`,
        time: new Date(selectedAlert.alertTime.getTime() + 5 * 60 * 1000),
        type: 'alert_escalated',
        title: '升级处置',
        description: '告警升级，已派发处置工单',
      });
    }

    relatedOrders.forEach((order) => {
      events.push({
        id: `order-create-${order.id}`,
        time: order.createdAt,
        type: 'order_created',
        title: '创建处置工单',
        description: `工单编号: ${order.id}\n处置人: ${order.handler}\n联系方式: ${order.contact}`,
      });

      if (order.status !== 'pending') {
        events.push({
          id: `order-process-${order.id}`,
          time: new Date(order.createdAt.getTime() + 3 * 60 * 1000),
          type: 'order_processing',
          title: '开始处置',
          description: '处置人员已接单赶赴现场',
        });
      }

      if (order.measures.check) {
        events.push({
          id: `measure-check-${order.id}`,
          time: new Date(order.createdAt.getTime() + 8 * 60 * 1000),
          type: 'measure_check',
          title: '现场核查',
          description: order.measures.check,
        });
      }

      if (order.measures.announcement) {
        events.push({
          id: `measure-ann-${order.id}`,
          time: new Date(order.createdAt.getTime() + 12 * 60 * 1000),
          type: 'measure_announcement',
          title: '喊话驱离',
          description: order.measures.announcement,
        });
      }

      if (order.measures.intercept) {
        events.push({
          id: `measure-int-${order.id}`,
          time: new Date(order.createdAt.getTime() + 18 * 60 * 1000),
          type: 'measure_intercept',
          title: '拦截处置',
          description: order.measures.intercept,
        });
      }

      if (order.status === 'completed' || order.status === 'closed') {
        events.push({
          id: `order-complete-${order.id}`,
          time: order.closedAt || new Date(order.createdAt.getTime() + 25 * 60 * 1000),
          type: order.status === 'closed' ? 'order_closed' : 'order_completed',
          title: order.status === 'closed' ? '工单关闭' : '处置完成',
          description: order.result || '处置完毕',
        });
      }
    });

    if (selectedAlert.status === 'resolved') {
      events.push({
        id: `alert-resolve-${selectedAlert.id}`,
        time: new Date(selectedAlert.alertTime.getTime() + 30 * 60 * 1000),
        type: 'alert_resolved',
        title: '告警解决',
        description: '目标已驱离，空域恢复正常',
      });
    }

    return events.sort((a, b) => a.time.getTime() - b.time.getTime());
  }, [selectedAlert, relatedOrders]);

  const getEventIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'alert_created':
      case 'alert_escalated':
        return <AlertTriangle className="w-5 h-5" />;
      case 'alert_confirmed':
      case 'order_completed':
      case 'order_closed':
      case 'alert_resolved':
        return <Check className="w-5 h-5" />;
      case 'alert_false_positive':
        return <XCircle className="w-5 h-5" />;
      case 'order_created':
      case 'order_processing':
        return <ClipboardList className="w-5 h-5" />;
      case 'measure_check':
        return <Target className="w-5 h-5" />;
      case 'measure_announcement':
        return <Cpu className="w-5 h-5" />;
      case 'measure_intercept':
        return <Shield className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const getEventColor = (type: TimelineEvent['type'], level?: number) => {
    if (type === 'alert_created') {
      return level === 1 ? 'text-alert-1 bg-alert-1/20 border-alert-1/50'
        : level === 2 ? 'text-alert-2 bg-alert-2/20 border-alert-2/50'
        : 'text-alert-3 bg-alert-3/20 border-alert-3/50';
    }
    if (type === 'alert_false_positive') return 'text-gray-400 bg-gray-500/20 border-gray-500/50';
    if (type === 'alert_resolved' || type === 'order_completed' || type === 'order_closed')
      return 'text-alert-success bg-alert-success/20 border-alert-success/50';
    if (type === 'alert_confirmed' || type === 'order_processing' || type.startsWith('measure'))
      return 'text-primary bg-primary/20 border-primary/50';
    if (type === 'alert_escalated') return 'text-alert-3 bg-alert-3/20 border-alert-3/50';
    return 'text-primary bg-primary/20 border-primary/50';
  };

  const formatTime = (date: Date) => {
    return date.toLocaleString('zh-CN', {
      month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  };

  const getTotalDuration = () => {
    if (timeline.length < 2) return '--';
    const start = timeline[0].time;
    const end = timeline[timeline.length - 1].time;
    const diff = Math.floor((end.getTime() - start.getTime()) / 1000);
    const mins = Math.floor(diff / 60);
    const secs = diff % 60;
    return `${mins}分${secs}秒`;
  };

  const exportReviewReport = () => {
    if (!selectedAlert) return;
    setExportingReport(true);
    setTimeout(() => {
      const now = new Date();
      const reportDate = now.toLocaleDateString('zh-CN');
      const reportTime = now.toLocaleTimeString('zh-CN');
      const finalResult =
        selectedAlert.status === 'resolved' ? '已解决（目标已驱离）' :
        selectedAlert.status === 'false_positive' ? '误报（已排除）' :
        selectedAlert.status === 'escalated' ? '处置中（已升级）' :
        selectedAlert.status === 'confirmed' ? '处置中（已确认）' :
        '待确认';

      const content = `
无人机黑飞检测系统 - 事件复盘报告
=====================================
生成时间: ${reportDate} ${reportTime}

一、告警背景信息
-------------------------------------
告警编号: ${selectedAlert.id}
告警等级: ${selectedAlert.level} 级
告警时间: ${selectedAlert.alertTime.toLocaleString('zh-CN')}
告警描述: ${selectedAlert.description}
发生位置: ${selectedAlert.position.lat.toFixed(6)}, ${selectedAlert.position.lng.toFixed(6)}
当前状态: ${alertStatusLabels[selectedAlert.status]}

目标信息:
  目标编号: ${relatedTarget?.id || '无'}
  目标类型: ${relatedTarget?.type || '未知'}
  出现时间: ${relatedTarget?.firstSeen.toLocaleString('zh-CN') || '-'}
  高度/速度: ${relatedTarget ? `H:${relatedTarget.altitude.toFixed(0)}m, V:${relatedTarget.speed.toFixed(1)}m/s` : '-'}

触发围栏:
  围栏名称: ${relatedFence?.name || '无'}
  围栏类型: ${relatedFence ? fenceTypeLabels[relatedFence.type] : '-'}
  限高标准: ${relatedFence?.maxHeight ?? '-'} m

探测设备:
  设备编号: ${relatedDevice?.id || '无'}
  设备名称: ${relatedDevice?.name || '-'}
  设备状态: ${relatedDevice?.status || '-'}

二、处置时间线
-------------------------------------
总耗时: ${getTotalDuration()}   事件数: ${timeline.length}
${timeline.map((e, i) => `${String(i + 1).padStart(2, '0')}. [${e.time.toLocaleString('zh-CN')}] ${e.title}${e.description ? `\\n    ${e.description.replace(/\\n/g, '\\n    ')}` : ''}`).join('\\n\\n')}

三、关联工单 (${relatedOrders.length})
-------------------------------------
${relatedOrders.length > 0 ? relatedOrders.map((o, i) => `
工单${i + 1}: ${o.id}
  状态: ${o.status === 'pending' ? '待处置' : o.status === 'processing' ? '处置中' : o.status === 'completed' ? '已完成' : '已关闭'}
  处置人: ${o.handler} (${o.contact})
  创建时间: ${o.createdAt.toLocaleString('zh-CN')}
  现场核查: ${o.measures.check || '未填写'}
  喊话驱离: ${o.measures.announcement || '未填写'}
  拦截处置: ${o.measures.intercept || '未填写'}
  处置结果: ${o.result || '未填写'}
  ${o.closedAt ? `完成时间: ${o.closedAt.toLocaleString('zh-CN')}` : ''}
`.trim()).join('\\n\\n') : '  （未关联工单）'}

四、最终结果
-------------------------------------
处置结论: ${finalResult}
状态说明: 处置状态为"${alertStatusLabels[selectedAlert.status]}"，已建工单 ${relatedOrders.length} 张

=====================================
报告生成完毕 - 可用于交接班、培训和留档
      `.trim();

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `事件复盘_${selectedAlert.id}_${toDateInputValue(now)}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setExportingReport(false);
    }, 500);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="h-14 bg-bg-secondary border-b border-border-primary flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/alerts')}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-sm transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            值班复盘
          </h2>
          <span className="text-sm text-gray-400">告警处置全流程时间线</span>
          <span className="badge badge-info">
            共 {sortedFilteredAlerts.length} 条
          </span>
        </div>
        {selectedAlert && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 border border-border-primary rounded-sm overflow-hidden">
              <button
                onClick={goPrev}
                disabled={currentIndex <= 0}
                className="px-2 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-bg-tertiary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 text-xs text-gray-400 font-mono min-w-[60px] text-center">
                {currentIndex >= 0 ? `${currentIndex + 1}/${sortedFilteredAlerts.length}` : '-/-'}
              </span>
              <button
                onClick={goNext}
                disabled={currentIndex < 0 || currentIndex >= sortedFilteredAlerts.length - 1}
                className="px-2 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-bg-tertiary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={exportReviewReport}
              disabled={exportingReport}
              className="btn-primary flex items-center gap-2"
            >
              {exportingReport ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  导出中...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  导出复盘报告
                </>
              )}
            </button>
            <span className={`badge badge-level-${selectedAlert.level}`}>
              等级 {selectedAlert.level}
            </span>
            <span className="text-gray-400 text-sm">总耗时:</span>
            <span className="font-mono text-primary text-sm">{getTotalDuration()}</span>
            <span className="text-gray-400 text-sm">事件数:</span>
            <span className="font-mono text-white text-sm">{timeline.length}</span>
          </div>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 border-r border-border-primary bg-bg-secondary/50 flex flex-col shrink-0">
          <div className="p-3 border-b border-border-primary space-y-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-primary">告警筛选</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  placeholder="选择日期"
                  className="flex-1 bg-bg-tertiary border border-border-primary rounded-sm px-2 py-1 text-xs text-white outline-none focus:border-primary"
                />
                {filterDate && (
                  <button
                    onClick={() => setFilterDate('')}
                    className="text-[10px] text-gray-400 hover:text-white px-1"
                    title="清除"
                  >
                    ×
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Gauge className="w-3.5 h-3.5 text-gray-400" />
                <select
                  value={filterLevel}
                  onChange={(e) => setFilterLevel(e.target.value as any)}
                  className="flex-1 bg-bg-tertiary border border-border-primary rounded-sm px-2 py-1 text-xs text-white outline-none focus:border-primary"
                >
                  <option value="">全部等级</option>
                  <option value="1">一级告警</option>
                  <option value="2">二级告警</option>
                  <option value="3">三级告警</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-gray-400" />
                <select
                  value={filterResult}
                  onChange={(e) => setFilterResult(e.target.value as any)}
                  className="flex-1 bg-bg-tertiary border border-border-primary rounded-sm px-2 py-1 text-xs text-white outline-none focus:border-primary"
                >
                  <option value="">全部结果</option>
                  <option value="pending">待确认</option>
                  <option value="active">处置中</option>
                  <option value="resolved">已解决</option>
                  <option value="false_positive">误报</option>
                </select>
              </div>
              {(filterDate || filterLevel || filterResult) && (
                <button
                  onClick={() => { setFilterDate(''); setFilterLevel(''); setFilterResult(''); }}
                  className="w-full text-[11px] text-primary hover:underline text-right"
                >
                  清除全部筛选
                </button>
              )}
            </div>
          </div>
          <div className="px-3 py-2 border-b border-border-primary bg-bg-secondary/50 flex items-center justify-between">
            <span className="text-xs text-gray-400">告警记录</span>
            <span className="text-[10px] text-gray-500">按时间倒序</span>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-2">
            {sortedFilteredAlerts.length > 0 ? (
              sortedFilteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => setSelectedAlertId(alert.id)}
                  className={`p-3 rounded-sm cursor-pointer transition-all ${
                    selectedAlertId === alert.id
                      ? 'bg-primary/10 border border-primary/50'
                      : 'bg-bg-card border border-border-primary hover:border-primary/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`font-mono text-sm ${selectedAlertId === alert.id ? 'text-primary' : 'text-white'}`}>
                      {alert.id}
                    </span>
                    <span className={`badge badge-level-${alert.level} text-[10px]`}>
                      等级 {alert.level}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 line-clamp-2">{alert.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-gray-500 font-mono">
                      {alert.alertTime.toLocaleString('zh-CN', {
                        month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                    <span className={`text-[10px] ${
                      alert.status === 'resolved' ? 'text-alert-success' :
                      alert.status === 'false_positive' ? 'text-gray-400' :
                      alert.status === 'pending' ? 'text-alert-1' :
                      'text-alert-2'
                    }`}>
                      {alertStatusLabels[alert.status]}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                <Filter className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-xs">筛选条件下无告警</p>
                <button
                  onClick={() => { setFilterDate(''); setFilterLevel(''); setFilterResult(''); }}
                  className="text-[11px] text-primary hover:underline mt-2"
                >
                  清除筛选
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
          {selectedAlert ? (
            <div className="max-w-3xl mx-auto">
              <div className="card mb-6">
                <div
                  className="card-header cursor-pointer select-none"
                  onClick={() => setExpanded(!expanded)}
                >
                  <h3 className="card-title flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    告警背景信息
                  </h3>
                  {expanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </div>
                {expanded && (
                  <div className="p-4 grid grid-cols-4 gap-4 text-sm">
                    <div className="bg-bg-tertiary p-3 rounded-sm">
                      <div className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-alert-1" />
                        告警信息
                      </div>
                      <div className="font-mono text-primary mb-1">{selectedAlert.id}</div>
                      <div className="text-xs text-gray-300">{selectedAlert.description}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {selectedAlert.alertTime.toLocaleString('zh-CN')}
                      </div>
                    </div>
                    <div className="bg-bg-tertiary p-3 rounded-sm">
                      <div className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                        <Target className="w-3 h-3 text-primary" />
                        目标信息
                      </div>
                      {relatedTarget ? (
                        <>
                          <div className="font-mono text-white flex items-center gap-1">
                            {relatedTarget.id}
                            <button
                              onClick={() => navigate(`/target/${relatedTarget.id}`)}
                              className="text-primary hover:underline"
                            >
                              <ArrowUpRight className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="text-xs text-gray-400">{relatedTarget.type}</div>
                          <div className="text-xs text-gray-500 font-mono">
                            H:{relatedTarget.altitude.toFixed(0)}m V:{relatedTarget.speed.toFixed(1)}m/s
                          </div>
                        </>
                      ) : (
                        <div className="text-xs text-gray-500">目标已离线</div>
                      )}
                    </div>
                    <div className="bg-bg-tertiary p-3 rounded-sm">
                      <div className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                        <Shield className="w-3 h-3 text-alert-2" />
                        触发围栏
                      </div>
                      {relatedFence ? (
                        <>
                          <div className="text-white mb-1">{relatedFence.name}</div>
                          <div className="text-xs text-gray-400">
                            {fenceTypeLabels[relatedFence.type]}
                          </div>
                          <div className="text-xs text-gray-500">
                            告警等级 {relatedFence.alertLevel}
                          </div>
                        </>
                      ) : (
                        <div className="text-xs text-gray-500">无围栏信息</div>
                      )}
                    </div>
                    <div className="bg-bg-tertiary p-3 rounded-sm">
                      <div className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                        <Cpu className="w-3 h-3 text-alert-success" />
                        探测设备
                      </div>
                      {relatedDevice ? (
                        <>
                          <div className="text-white mb-1">{relatedDevice.name}</div>
                          <div className="text-xs text-gray-400">
                            {relatedDevice.type === 'radar' ? '雷达' :
                             relatedDevice.type === 'telemetry' ? '遥测' : '光电'}
                          </div>
                          <div className={`text-xs ${
                            relatedDevice.status === 'online' ? 'text-alert-success' :
                            relatedDevice.status === 'fault' ? 'text-alert-1' : 'text-gray-500'
                          }`}>
                            {relatedDevice.status === 'online' ? '在线' :
                             relatedDevice.status === 'fault' ? '故障' : '离线'}
                          </div>
                        </>
                      ) : (
                        <div className="text-xs text-gray-500">无设备信息</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative">
                <div className="absolute left-6 top-2 bottom-2 w-0.5 bg-border-primary" />
                {timeline.map((event, index) => (
                  <div key={event.id} className="relative pl-16 pb-8 last:pb-0">
                    <div className={`absolute left-4 w-10 h-10 rounded-full border-2 flex items-center justify-center ${getEventColor(event.type, event.level)}`}>
                      {getEventIcon(event.type)}
                    </div>
                    <div className={`card border-l-4 ${
                      event.type === 'alert_created' && event.level === 1 ? 'border-l-alert-1' :
                      event.type === 'alert_created' && event.level === 2 ? 'border-l-alert-2' :
                      event.type === 'alert_created' ? 'border-l-alert-3' :
                      event.type === 'alert_false_positive' ? 'border-l-gray-500' :
                      event.type === 'alert_resolved' || event.type === 'order_completed' || event.type === 'order_closed'
                        ? 'border-l-alert-success'
                        : 'border-l-primary'
                    }`}>
                      <div className="card-header flex items-center justify-between">
                        <h4 className="card-title text-white text-sm">{event.title}</h4>
                        <div className="flex items-center gap-2 text-xs">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span className="font-mono text-gray-400">{formatTime(event.time)}</span>
                          <span className="text-gray-600">#{index + 1}</span>
                        </div>
                      </div>
                      {event.description && (
                        <div className="px-4 pb-3 text-sm text-gray-300 whitespace-pre-line">
                          {event.description}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {relatedOrders.length > 0 && (
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
                      <ClipboardList className="w-4 h-4" />
                      关联工单 ({relatedOrders.length})
                    </h3>
                    <button
                      onClick={() => navigate(`/workorders?expandWo=${relatedOrders[0]?.id}`)}
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      查看详情 <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {relatedOrders.map((order) => (
                      <div key={order.id} className="card p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-primary">{order.id}</span>
                          <span className="badge badge-info text-[10px]">
                            {order.status === 'pending' ? '待处置' :
                             order.status === 'processing' ? '处置中' :
                             order.status === 'completed' ? '已完成' : '已关闭'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                          <div>处置人: <span className="text-white">{order.handler}</span></div>
                          <div>联系方式: <span className="text-white">{order.contact}</span></div>
                        </div>
                        {order.result && (
                          <div className="mt-2 pt-2 border-t border-border-primary text-xs text-gray-300">
                            结果: {order.result}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <History className="w-16 h-16 mb-4 opacity-20" />
              <p>请从左侧选择一条告警查看处置时间线</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

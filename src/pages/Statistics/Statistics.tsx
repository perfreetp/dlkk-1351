import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from 'recharts';
import {
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  Clock,
  Download,
  Calendar,
  FileText,
  AlertTriangle,
  Target,
  MapPin,
  ChevronRight,
} from 'lucide-react';
import {
  alertStatusLabels,
} from '@/data/mockData';
import { useAppStore } from '@/store';
import { generateStatsFromTo, getDateRangeBoundaries, isInRange, toDateInputValue } from '@/lib/utils';

type TimeRange = 'day' | 'week' | 'month' | 'custom';

export default function Statistics() {
  const { alerts, workOrders, targets, fences } = useAppStore();
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [startDate, setStartDate] = useState<string>(() => toDateInputValue(new Date(Date.now() - 1000*60*60*24*6)));
  const [endDate, setEndDate] = useState<string>(() => toDateInputValue(new Date()));
  const [exporting, setExporting] = useState(false);

  const rangeBoundaries = useMemo(() => {
    return getDateRangeBoundaries(timeRange, startDate, endDate);
  }, [timeRange, startDate, endDate]);

  const rangeLabel = useMemo(() => {
    if (timeRange === 'day') return '今日';
    if (timeRange === 'week') return '近7天';
    if (timeRange === 'month') return '近30天';
    return `${startDate} 至 ${endDate}`;
  }, [timeRange, startDate, endDate]);

  const statisticsData = useMemo(() => {
    return generateStatsFromTo(rangeBoundaries.start, rangeBoundaries.end, alerts);
  }, [rangeBoundaries, alerts]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => isInRange(a.alertTime, rangeBoundaries.start, rangeBoundaries.end));
  }, [alerts, rangeBoundaries]);

  const filteredWorkOrders = useMemo(() => {
    return workOrders.filter((w) => isInRange(w.createdAt, rangeBoundaries.start, rangeBoundaries.end));
  }, [workOrders, rangeBoundaries]);

  const alertStats = useMemo(() => {
    const total = filteredAlerts.length;
    const pending = filteredAlerts.filter((a) => a.status === 'pending').length;
    const confirmed = filteredAlerts.filter((a) => a.status === 'confirmed').length;
    const falsePositive = filteredAlerts.filter((a) => a.status === 'false_positive').length;
    const escalated = filteredAlerts.filter((a) => a.status === 'escalated').length;
    const resolved = filteredAlerts.filter((a) => a.status === 'resolved').length;
    const level1 = filteredAlerts.filter((a) => a.level === 1).length;
    const level2 = filteredAlerts.filter((a) => a.level === 2).length;
    const level3 = filteredAlerts.filter((a) => a.level === 3).length;

    return {
      total,
      pending,
      confirmed,
      falsePositive,
      escalated,
      resolved,
      level1,
      level2,
      level3,
    };
  }, [filteredAlerts]);

  const workOrderStats = useMemo(() => {
    const total = filteredWorkOrders.length;
    const pending = filteredWorkOrders.filter((w) => w.status === 'pending').length;
    const processing = filteredWorkOrders.filter((w) => w.status === 'processing').length;
    const completed = filteredWorkOrders.filter((w) => w.status === 'completed').length;
    const closed = filteredWorkOrders.filter((w) => w.status === 'closed').length;

    return { total, pending, processing, completed, closed };
  }, [filteredWorkOrders]);

  const areaStats = useMemo(() => {
    const countMap: Record<string, number> = {};
    filteredAlerts.forEach((a) => {
      const fence = fences.find((f) => f.id === a.fenceId);
      const name = fence ? fence.name : '未归属区域';
      countMap[name] = (countMap[name] || 0) + 1;
    });
    const colors = ['#ff3d3d', '#ff8a00', '#ffc700', '#00d4ff', '#00ff88', '#a855f7', '#ec4899'];
    const entries = Object.entries(countMap).sort((a, b) => b[1] - a[1]);
    return entries.map(([name, count], i) => ({
      name,
      count,
      color: colors[i % colors.length],
    }));
  }, [filteredAlerts, fences]);

  const typeStats = useMemo(() => {
    const countMap: Record<string, number> = {};
    filteredAlerts.forEach((a) => {
      const target = targets.find((t) => t.id === a.targetId);
      const type = target ? target.type : '未知类型';
      countMap[type] = (countMap[type] || 0) + 1;
    });
    return Object.entries(countMap)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredAlerts, targets]);

  const timeSlotStats = useMemo(() => {
    const slots = ['00:00-06:00', '06:00-12:00', '12:00-18:00', '18:00-24:00'];
    const counts = [0, 0, 0, 0];
    filteredAlerts.forEach((a) => {
      const hour = a.alertTime.getHours();
      const idx = hour < 6 ? 0 : hour < 12 ? 1 : hour < 18 ? 2 : 3;
      counts[idx]++;
    });
    return slots.map((slot, i) => ({ slot, count: counts[i] }));
  }, [filteredAlerts]);

  const handleExportReport = () => {
    setExporting(true);

    setTimeout(() => {
      const now = new Date();
      const reportDate = now.toLocaleDateString('zh-CN');
      const reportTime = now.toLocaleTimeString('zh-CN');
      const boundaryInfo = `${toDateInputValue(rangeBoundaries.start)} 00:00:00 至 ${toDateInputValue(rangeBoundaries.end)} 23:59:59`;
      const trendTotal = statisticsData.reduce((s, d) => s + d.count, 0);
      const levelTotal = alertStats.level1 + alertStats.level2 + alertStats.level3;

      const reportContent = `
无人机黑飞检测系统 - 值班报告
=====================================
生成时间: ${reportDate} ${reportTime}
统计周期: ${rangeLabel}
时间范围: ${boundaryInfo}
数据核对: 告警总数=${alertStats.total} 趋势汇总=${trendTotal} 等级汇总=${levelTotal}

一、告警统计 (${rangeLabel})
-------------------------------------
总告警数: ${alertStats.total}
一级告警: ${alertStats.level1}
二级告警: ${alertStats.level2}
三级告警: ${alertStats.level3}

待确认: ${alertStats.pending}
已确认: ${alertStats.confirmed}
误报: ${alertStats.falsePositive}
已升级: ${alertStats.escalated}
已解决: ${alertStats.resolved}

二、工单统计 (${rangeLabel})
-------------------------------------
总工单数: ${workOrderStats.total}
待处置: ${workOrderStats.pending}
处置中: ${workOrderStats.processing}
已完成: ${workOrderStats.completed}
已关闭: ${workOrderStats.closed}

三、区域分布
-------------------------------------
${areaStats.length > 0 ? areaStats.map((a) => `${a.name}: ${a.count}次`).join('\n') : '  （周期内无数据）'}

四、目标类型分布
-------------------------------------
${typeStats.length > 0 ? typeStats.map((t) => `${t.type}: ${t.count}次`).join('\n') : '  （周期内无数据）'}

五、时段分布
-------------------------------------
${timeSlotStats.map((t) => `${t.slot}: ${t.count}次`).join('\n')}

六、告警趋势明细 (${rangeLabel})
-------------------------------------
${statisticsData.map((d) => `${d.date}: 总计${d.count}次 (一级${d.level1} 二级${d.level2} 三级${d.level3})`).join('\n')}

=====================================
报告生成完毕
      `.trim();

      const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const safeRange = rangeLabel.replace(/[\\/:*?"<>|]/g, '_');
      link.download = `值班报告_${safeRange}_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExporting(false);
    }, 1000);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-bg-card/95 backdrop-blur border border-border-primary rounded-sm p-3 shadow-lg">
          <p className="text-primary font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const pieData = areaStats.length > 0 ? areaStats.map((a) => ({
    name: a.name,
    value: a.count,
    color: a.color,
  })) : [{ name: '暂无数据', value: 1, color: '#374151' }];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="h-14 bg-bg-secondary border-b border-border-primary flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            统计报表
          </h2>
          <span className="text-sm text-gray-400">数据可视化分析</span>
          <span className="badge badge-info">
            {rangeLabel}
          </span>
          <span className="text-[11px] text-gray-500 font-mono">
            {toDateInputValue(rangeBoundaries.start)} ~ {toDateInputValue(rangeBoundaries.end)}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">周期:</span>
            <div className="flex rounded-sm border border-border-primary overflow-hidden">
              {(['day', 'week', 'month', 'custom'] as TimeRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1.5 text-sm transition-all ${
                    timeRange === range
                      ? 'bg-primary/20 text-primary border-r border-border-primary last:border-r-0'
                      : 'text-gray-400 hover:text-white hover:bg-bg-tertiary border-r border-border-primary last:border-r-0'
                  }`}
                >
                  {range === 'day' ? '今日' : range === 'week' ? '近7天' : range === 'month' ? '近30天' : '自定义'}
                </button>
              ))}
            </div>
            {timeRange === 'custom' && (
              <div className="flex items-center gap-2 ml-2">
                <input
                  type="date"
                  value={startDate}
                  max={endDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-bg-secondary border border-border-primary rounded-sm px-2 py-1 text-sm text-white outline-none focus:border-primary w-36"
                />
                <ChevronRight className="w-4 h-4 text-gray-500" />
                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-bg-secondary border border-border-primary rounded-sm px-2 py-1 text-sm text-white outline-none focus:border-primary w-36"
                />
              </div>
            )}
          </div>

          <button
            onClick={handleExportReport}
            disabled={exporting}
            className="btn-primary flex items-center gap-2"
          >
            {exporting ? (
              <>
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                导出中...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                导出值班报告
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-6">
        <div className="grid grid-cols-4 gap-4">
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm">总告警数</span>
              <AlertTriangle className="w-5 h-5 text-alert-1" />
            </div>
            <div className="text-3xl font-mono font-bold text-white animate-number">
              {alertStats.total}
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className="text-alert-1">一级 {alertStats.level1}</span>
              <span className="text-alert-2">二级 {alertStats.level2}</span>
              <span className="text-alert-3">三级 {alertStats.level3}</span>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm">待处置</span>
              <Clock className="w-5 h-5 text-alert-2" />
            </div>
            <div className="text-3xl font-mono font-bold text-alert-2 animate-number">
              {alertStats.pending + workOrderStats.pending}
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className="text-gray-400">告警待确认 {alertStats.pending}</span>
              <span className="text-gray-400">工单待处置 {workOrderStats.pending}</span>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm">处置中</span>
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div className="text-3xl font-mono font-bold text-primary animate-number">
              {workOrderStats.processing}
            </div>
            <div className="mt-2 text-xs text-gray-400">
              已确认告警 {alertStats.confirmed} 起
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm">已解决</span>
              <PieChartIcon className="w-5 h-5 text-alert-success" />
            </div>
            <div className="text-3xl font-mono font-bold text-alert-success animate-number">
              {alertStats.resolved + workOrderStats.completed}
            </div>
            <div className="mt-2 text-xs text-gray-400">
              误报率 {alertStats.total > 0 ? ((alertStats.falsePositive / alertStats.total) * 100).toFixed(1) : '0.0'}%
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                告警趋势 ({rangeLabel})
              </h3>
              <div className="flex gap-4 text-xs">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-alert-1" />
                  一级告警
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-alert-2" />
                  二级告警
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-alert-3" />
                  三级告警
                </span>
              </div>
            </div>
            <div className="p-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={statisticsData}>
                  <defs>
                    <linearGradient id="colorLevel1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff3d3d" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ff3d3d" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorLevel2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff8a00" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ff8a00" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorLevel3" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ffc700" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ffc700" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 212, 255, 0.1)" />
                  <XAxis
                    dataKey="date"
                    stroke="#6b7280"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(0, 212, 255, 0.2)' }}
                  />
                  <YAxis
                    stroke="#6b7280"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(0, 212, 255, 0.2)' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="level1"
                    name="一级告警"
                    stroke="#ff3d3d"
                    fillOpacity={1}
                    fill="url(#colorLevel1)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="level2"
                    name="二级告警"
                    stroke="#ff8a00"
                    fillOpacity={1}
                    fill="url(#colorLevel2)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="level3"
                    name="三级告警"
                    stroke="#ffc700"
                    fillOpacity={1}
                    fill="url(#colorLevel3)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                区域分布
              </h3>
            </div>
            <div className="p-4 h-72 flex">
              <div className="w-1/2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-1/2 flex flex-col justify-center space-y-3">
                {pieData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm text-gray-300">{item.name}</span>
                    </div>
                    <span className="font-mono font-bold text-white">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title flex items-center gap-2">
                <Target className="w-4 h-4" />
                目标类型分布
              </h3>
            </div>
            <div className="p-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeStats.length > 0 ? typeStats : [{ type: '暂无数据', count: 0 }]} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 212, 255, 0.1)" />
                  <XAxis
                    type="number"
                    stroke="#6b7280"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(0, 212, 255, 0.2)' }}
                  />
                  <YAxis
                    dataKey="type"
                    type="category"
                    stroke="#6b7280"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(0, 212, 255, 0.2)' }}
                    width={100}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="count"
                    name="数量"
                    fill="#00d4ff"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title flex items-center gap-2">
                <Clock className="w-4 h-4" />
                时段分布
              </h3>
            </div>
            <div className="p-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeSlotStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 212, 255, 0.1)" />
                  <XAxis
                    dataKey="slot"
                    stroke="#6b7280"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(0, 212, 255, 0.2)' }}
                  />
                  <YAxis
                    stroke="#6b7280"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(0, 212, 255, 0.2)' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="告警数"
                    stroke="#00ff88"
                    strokeWidth={3}
                    dot={{ fill: '#00ff88', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#00ff88' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title flex items-center gap-2">
              <FileText className="w-4 h-4" />
              告警处置统计 ({rangeLabel})
            </h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-5 gap-4">
              {Object.entries(alertStatusLabels).map(([key, label]) => {
                const count = key === 'pending' ? alertStats.pending :
                              key === 'confirmed' ? alertStats.confirmed :
                              key === 'false_positive' ? alertStats.falsePositive :
                              key === 'escalated' ? alertStats.escalated :
                              alertStats.resolved;
                const percentage = alertStats.total > 0 ? ((count / alertStats.total) * 100).toFixed(1) : '0.0';

                return (
                  <div key={key} className="text-center">
                    <div className="text-3xl font-mono font-bold text-white mb-1">
                      {count}
                    </div>
                    <div className={`text-sm mb-2 ${
                      key === 'pending' ? 'text-alert-1' :
                      key === 'confirmed' ? 'text-primary' :
                      key === 'false_positive' ? 'text-gray-400' :
                      key === 'escalated' ? 'text-alert-2' :
                      'text-alert-success'
                    }`}>
                      {label}
                    </div>
                    <div className="w-full bg-bg-secondary rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          key === 'pending' ? 'bg-alert-1' :
                          key === 'confirmed' ? 'bg-primary' :
                          key === 'false_positive' ? 'bg-gray-500' :
                          key === 'escalated' ? 'bg-alert-2' :
                          'bg-alert-success'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-400 mt-1">{percentage}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

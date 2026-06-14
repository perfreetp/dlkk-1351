import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ClipboardList, Plus, Search, Filter, Check, X, Clock, User, Phone, FileText, Megaphone, Ban, Eye, CheckCircle } from 'lucide-react';
import { useAppStore } from '@/store';
import type { WorkOrderStatus, WorkOrder } from '@/types';
import { workOrderStatusLabels, alertStatusLabels } from '@/data/mockData';

export default function WorkOrders() {
  const [searchParams] = useSearchParams();
  const alertIdParam = searchParams.get('alertId');
  const { workOrders, alerts, addWorkOrder, updateWorkOrderStatus, updateWorkOrder } = useAppStore();
  const [activeTab, setActiveTab] = useState<WorkOrderStatus | 'all'>('all');
  const [searchText, setSearchText] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(!!alertIdParam);
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const [formData, setFormData] = useState({
    alertId: alertIdParam || '',
    handler: '',
    contact: '',
    check: '',
    announcement: '',
    intercept: '',
    result: '',
  });

  const filteredOrders = useMemo(() => {
    return workOrders.filter((order) => {
      if (activeTab !== 'all' && order.status !== activeTab) return false;
      if (searchText && !order.id.includes(searchText) && !order.handler.includes(searchText)) return false;
      return true;
    });
  }, [workOrders, activeTab, searchText]);

  const stats = useMemo(() => ({
    total: workOrders.length,
    pending: workOrders.filter((o) => o.status === 'pending').length,
    processing: workOrders.filter((o) => o.status === 'processing').length,
    completed: workOrders.filter((o) => o.status === 'completed').length,
    closed: workOrders.filter((o) => o.status === 'closed').length,
  }), [workOrders]);

  const handleCreate = () => {
    if (!formData.alertId || !formData.handler || !formData.contact) {
      alert('请填写完整信息');
      return;
    }

    const newOrder: WorkOrder = {
      id: `W-${String(workOrders.length + 1).padStart(3, '0')}`,
      alertId: formData.alertId,
      handler: formData.handler,
      contact: formData.contact,
      status: 'processing',
      measures: {
        check: formData.check || undefined,
        announcement: formData.announcement || undefined,
        intercept: formData.intercept || undefined,
      },
      result: formData.result,
      createdAt: new Date(),
    };

    addWorkOrder(newOrder);
    setShowCreateForm(false);
    setFormData({
      alertId: '',
      handler: '',
      contact: '',
      check: '',
      announcement: '',
      intercept: '',
      result: '',
    });
  };

  const handleUpdateMeasures = () => {
    if (!selectedOrder) return;
    
    updateWorkOrder(selectedOrder.id, {
      measures: {
        check: formData.check || selectedOrder.measures.check,
        announcement: formData.announcement || selectedOrder.measures.announcement,
        intercept: formData.intercept || selectedOrder.measures.intercept,
      },
      result: formData.result || selectedOrder.result,
    });
    
    setShowDetail(false);
    setSelectedOrder(null);
  };

  const getStatusBadge = (status: WorkOrderStatus) => {
    const styles: Record<WorkOrderStatus, string> = {
      pending: 'bg-alert-3/20 text-alert-3 border-alert-3/50',
      processing: 'bg-primary/20 text-primary border-primary/50',
      completed: 'bg-alert-success/20 text-alert-success border-alert-success/50',
      closed: 'bg-gray-500/20 text-gray-400 border-gray-500/50',
    };
    return (
      <span className={`badge border ${styles[status]}`}>
        {workOrderStatusLabels[status]}
      </span>
    );
  };

  const getAlertInfo = (alertId: string) => {
    return alerts.find((a) => a.id === alertId);
  };

  const openDetail = (order: WorkOrder) => {
    setSelectedOrder(order);
    setFormData({
      alertId: order.alertId,
      handler: order.handler,
      contact: order.contact,
      check: order.measures.check || '',
      announcement: order.measures.announcement || '',
      intercept: order.measures.intercept || '',
      result: order.result || '',
    });
    setShowDetail(true);
  };

  const tabs = [
    { key: 'all', label: '全部', count: stats.total },
    { key: 'pending', label: '待处置', count: stats.pending, color: 'text-alert-3' },
    { key: 'processing', label: '处置中', count: stats.processing, color: 'text-primary' },
    { key: 'completed', label: '已完成', count: stats.completed, color: 'text-alert-success' },
    { key: 'closed', label: '已关闭', count: stats.closed, color: 'text-gray-400' },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="h-14 bg-bg-secondary border-b border-border-primary flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" />
            处置工单
          </h2>
          <span className="text-sm text-gray-400">共 {filteredOrders.length} 条工单</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-alert-3" />
              <span className="text-gray-400">待处置</span>
              <span className="text-alert-3 font-mono font-bold">{stats.pending}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-gray-400">处置中</span>
              <span className="text-primary font-mono font-bold">{stats.processing}</span>
            </div>
          </div>

          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            新建工单
          </button>
        </div>
      </div>

      <div className="h-12 bg-bg-secondary/50 border-b border-border-primary flex items-center px-6 gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as WorkOrderStatus | 'all')}
            className={`px-4 py-2 text-sm rounded-sm transition-all ${
              activeTab === tab.key
                ? 'bg-primary/15 text-primary border-b-2 border-primary'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.label}
            <span className={`ml-2 font-mono ${tab.color || ''}`}>{tab.count}</span>
          </button>
        ))}

        <div className="flex-1" />

        <div className="relative">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="搜索工单ID或处置人..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="input-field pl-9 w-64 py-1.5"
          />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-auto scrollbar-thin">
          <table className="w-full">
            <thead className="sticky top-0 bg-bg-secondary z-10">
              <tr>
                <th className="table-header">工单ID</th>
                <th className="table-header">关联告警</th>
                <th className="table-header">处置人</th>
                <th className="table-header">联系方式</th>
                <th className="table-header">状态</th>
                <th className="table-header">创建时间</th>
                <th className="table-header">处置措施</th>
                <th className="table-header text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const alert = getAlertInfo(order.alertId);
                return (
                  <tr key={order.id} className="table-row">
                    <td className="px-4 py-3">
                      <span className="font-mono text-primary">{order.id}</span>
                    </td>
                    <td className="px-4 py-3">
                      {alert && (
                        <div className="text-sm">
                          <div className="font-mono text-white">{alert.id}</div>
                          <div className="text-xs text-gray-500">{alert.description}</div>
                          <div className="text-xs text-gray-500">
                            <span className={`badge badge-level-${alert.level} mt-1`}>
                              等级 {alert.level}
                            </span>
                            <span className="ml-2">{alertStatusLabels[alert.status]}</span>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-white">{order.handler}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="font-mono text-gray-300">{order.contact}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(order.status)}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-400">
                        {order.createdAt.toLocaleString('zh-CN')}
                      </div>
                      {order.closedAt && (
                        <div className="text-xs text-gray-500">
                          关闭: {order.closedAt.toLocaleString('zh-CN')}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {order.measures.check && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded">
                            <FileText className="w-3 h-3" />
                            核查
                          </span>
                        )}
                        {order.measures.announcement && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-alert-warning/10 text-alert-warning text-xs rounded">
                            <Megaphone className="w-3 h-3" />
                            喊话
                          </span>
                        )}
                        {order.measures.intercept && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-alert-danger/10 text-alert-danger text-xs rounded">
                            <Ban className="w-3 h-3" />
                            拦截
                          </span>
                        )}
                        {!order.measures.check && !order.measures.announcement && !order.measures.intercept && (
                          <span className="text-xs text-gray-500">暂无处置措施</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openDetail(order)}
                          className="p-1.5 text-primary hover:bg-primary/10 rounded-sm transition-colors"
                          title="查看详情"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {(order.status === 'pending' || order.status === 'processing') && (
                          <button
                            onClick={() => updateWorkOrderStatus(order.id, 'completed')}
                            className="p-1.5 text-alert-success hover:bg-alert-success/10 rounded-sm transition-colors"
                            title="完成处置"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {order.status === 'completed' && (
                          <button
                            onClick={() => updateWorkOrderStatus(order.id, 'closed')}
                            className="p-1.5 text-gray-400 hover:bg-gray-400/10 rounded-sm transition-colors"
                            title="关闭工单"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredOrders.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <ClipboardList className="w-16 h-16 mb-4 opacity-20" />
              <p>暂无符合条件的工单</p>
            </div>
          )}
        </div>

        {(showCreateForm || showDetail) && (
          <div className="w-96 border-l border-border-primary bg-bg-secondary/50 overflow-y-auto scrollbar-thin">
            <div className="p-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  {showDetail ? '工单详情' : '新建工单'}
                </h3>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setShowDetail(false);
                    setSelectedOrder(null);
                  }}
                  className="p-1 text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">关联告警ID</label>
                  <select
                    value={formData.alertId}
                    onChange={(e) => setFormData({ ...formData, alertId: e.target.value })}
                    className="input-field"
                    disabled={showDetail}
                  >
                    <option value="">请选择告警</option>
                    {alerts.filter(a => a.status !== 'resolved' && a.status !== 'false_positive').map((alert) => (
                      <option key={alert.id} value={alert.id}>
                        {alert.id} - {alert.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">处置人</label>
                  <input
                    type="text"
                    value={formData.handler}
                    onChange={(e) => setFormData({ ...formData, handler: e.target.value })}
                    className="input-field"
                    placeholder="请输入处置人姓名"
                    disabled={showDetail}
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">联系电话</label>
                  <input
                    type="tel"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    className="input-field"
                    placeholder="请输入联系电话"
                    disabled={showDetail}
                  />
                </div>

                <div className="border-t border-border-primary pt-4 mt-4">
                  <h4 className="text-sm font-medium text-white mb-3">处置措施</h4>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1 flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        现场核查
                      </label>
                      <textarea
                        value={formData.check}
                        onChange={(e) => setFormData({ ...formData, check: e.target.value })}
                        className="input-field min-h-[80px] resize-none"
                        placeholder="记录现场核查情况..."
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-1 flex items-center gap-1">
                        <Megaphone className="w-3 h-3" />
                        喊话驱离
                      </label>
                      <textarea
                        value={formData.announcement}
                        onChange={(e) => setFormData({ ...formData, announcement: e.target.value })}
                        className="input-field min-h-[80px] resize-none"
                        placeholder="记录喊话内容和效果..."
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-1 flex items-center gap-1">
                        <Ban className="w-3 h-3" />
                        拦截处置
                      </label>
                      <textarea
                        value={formData.intercept}
                        onChange={(e) => setFormData({ ...formData, intercept: e.target.value })}
                        className="input-field min-h-[80px] resize-none"
                        placeholder="记录拦截措施和结果..."
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-border-primary pt-4">
                  <label className="block text-xs text-gray-400 mb-1">处置结果</label>
                  <textarea
                    value={formData.result}
                    onChange={(e) => setFormData({ ...formData, result: e.target.value })}
                    className="input-field min-h-[80px] resize-none"
                    placeholder="记录最终处置结果..."
                  />
                </div>

                {selectedOrder && (
                  <div className="border-t border-border-primary pt-4">
                    <div className="text-xs text-gray-400 space-y-1">
                      <div className="flex justify-between">
                        <span>创建时间</span>
                        <span>{selectedOrder.createdAt.toLocaleString('zh-CN')}</span>
                      </div>
                      {selectedOrder.closedAt && (
                        <div className="flex justify-between">
                          <span>关闭时间</span>
                          <span>{selectedOrder.closedAt.toLocaleString('zh-CN')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-6">
                {showDetail ? (
                  <>
                    <button
                      onClick={handleUpdateMeasures}
                      className="btn-primary flex-1 flex items-center justify-center gap-1"
                    >
                      <Check className="w-4 h-4" />
                      更新处置
                    </button>
                    {selectedOrder?.status !== 'closed' && (
                      <button
                        onClick={() => {
                          updateWorkOrderStatus(selectedOrder.id, 'closed');
                          setShowDetail(false);
                          setSelectedOrder(null);
                        }}
                        className="btn-danger flex-1"
                      >
                        关闭工单
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <button onClick={handleCreate} className="btn-primary flex-1 flex items-center justify-center gap-1">
                      <Check className="w-4 h-4" />
                      创建工单
                    </button>
                    <button
                      onClick={() => {
                        setShowCreateForm(false);
                        setFormData({
                          alertId: '',
                          handler: '',
                          contact: '',
                          check: '',
                          announcement: '',
                          intercept: '',
                          result: '',
                        });
                      }}
                      className="btn-danger flex-1"
                    >
                      取消
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

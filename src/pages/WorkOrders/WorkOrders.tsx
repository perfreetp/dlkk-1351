import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ClipboardList, Plus, User, Phone, FileText, AlertTriangle, Target, Shield, Check, X, Edit2, Save } from 'lucide-react';
import { useAppStore } from '@/store';
import type { WorkOrderStatus, WorkOrder } from '@/types';

export default function WorkOrders() {
  const [searchParams] = useSearchParams();
  const alertIdParam = searchParams.get('alertId');
  const expandWoParam = searchParams.get('expandWo');
  const { workOrders, setWorkOrders, alerts, targets, fences, addWorkOrder, updateWorkOrder, updateWorkOrderStatus } = useAppStore();
  const [activeTab, setActiveTab] = useState<WorkOrderStatus | 'all'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [newOrder, setNewOrder] = useState<Partial<WorkOrder>>({
    alertId: '',
    handler: '',
    contact: '',
    status: 'pending',
    measures: { check: null, announcement: null, intercept: null },
    result: '',
  });

  const [editMeasures, setEditMeasures] = useState<{ check?: string | null; announcement?: string | null; intercept?: string | null }>({
    check: null, announcement: null, intercept: null
  });
  const [editResult, setEditResult] = useState('');

  useEffect(() => {
    if (expandWoParam) {
      setExpandedId(expandWoParam);
    }
  }, [expandWoParam]);

  useEffect(() => {
    if (alertIdParam) {
      const alert = alerts.find((a) => a.id === alertIdParam);
      if (alert) {
        setNewOrder((prev) => ({
          ...prev,
          alertId: alertIdParam,
        }));
        setShowCreateModal(true);
      }
    }
  }, [alertIdParam, alerts]);

  const prefilledAlert = useMemo(() => {
    if (!newOrder.alertId) return null;
    return alerts.find((a) => a.id === newOrder.alertId);
  }, [newOrder.alertId, alerts]);

  const prefilledTarget = useMemo(() => {
    if (!prefilledAlert) return null;
    return targets.find((t) => t.id === prefilledAlert.targetId);
  }, [prefilledAlert, targets]);

  const prefilledFence = useMemo(() => {
    if (!prefilledAlert) return null;
    return fences.find((f) => f.id === prefilledAlert.fenceId);
  }, [prefilledAlert, fences]);

  const filteredWorkOrders = useMemo(() => {
    if (activeTab === 'all') return workOrders;
    return workOrders.filter((w) => w.status === activeTab);
  }, [workOrders, activeTab]);

  const tabCounts = useMemo(() => ({
    all: workOrders.length,
    pending: workOrders.filter((w) => w.status === 'pending').length,
    processing: workOrders.filter((w) => w.status === 'processing').length,
    completed: workOrders.filter((w) => w.status === 'completed').length,
    closed: workOrders.filter((w) => w.status === 'closed').length,
  }), [workOrders]);

  const handleSubmitNew = () => {
    if (!newOrder.handler || !newOrder.contact) return;
    const id = `WO${Date.now().toString().slice(-6)}`;
    const order: WorkOrder = {
      id,
      alertId: newOrder.alertId || '',
      handler: newOrder.handler,
      contact: newOrder.contact,
      status: newOrder.status || 'pending',
      measures: {
        check: newOrder.measures?.check || null,
        announcement: newOrder.measures?.announcement || null,
        intercept: newOrder.measures?.intercept || null,
      },
      result: newOrder.result || '',
      createdAt: new Date(),
    };
    addWorkOrder(order);
    setShowCreateModal(false);
    setNewOrder({
      alertId: '',
      handler: '',
      contact: '',
      status: 'pending',
      measures: { check: null, announcement: null, intercept: null },
      result: '',
    });
  };

  const handleStartEdit = (order: WorkOrder) => {
    setEditingId(order.id);
    setEditMeasures({
      check: order.measures.check ?? null,
      announcement: order.measures.announcement ?? null,
      intercept: order.measures.intercept ?? null,
    });
    setEditResult(order.result || '');
  };

  const handleSaveEdit = (orderId: string) => {
    updateWorkOrder(orderId, {
      measures: {
        check: editMeasures.check === '' ? null : editMeasures.check,
        announcement: editMeasures.announcement === '' ? null : editMeasures.announcement,
        intercept: editMeasures.intercept === '' ? null : editMeasures.intercept,
      },
      result: editResult,
    });
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const tabs: { key: WorkOrderStatus | 'all'; label: string; color: string }[] = [
    { key: 'all', label: '全部', color: 'text-primary' },
    { key: 'pending', label: '待处置', color: 'text-alert-1' },
    { key: 'processing', label: '处置中', color: 'text-alert-2' },
    { key: 'completed', label: '已完成', color: 'text-alert-success' },
    { key: 'closed', label: '已关闭', color: 'text-gray-400' },
  ];

  const getStatusBadge = (status: WorkOrderStatus) => {
    const styles: Record<WorkOrderStatus, string> = {
      pending: 'bg-alert-1/20 text-alert-1 border-alert-1/50',
      processing: 'bg-alert-2/20 text-alert-2 border-alert-2/50',
      completed: 'bg-alert-success/20 text-alert-success border-alert-success/50',
      closed: 'bg-gray-500/20 text-gray-400 border-gray-500/50',
    };
    const labels: Record<WorkOrderStatus, string> = {
      pending: '待处置',
      processing: '处置中',
      completed: '已完成',
      closed: '已关闭',
    };
    return <span className={`badge border ${styles[status]}`}>{labels[status]}</span>;
  };

  const getRelatedAlert = (alertId: string) => alerts.find((a) => a.id === alertId);
  const getRelatedTarget = (targetId: string) => targets.find((t) => t.id === targetId);
  const getRelatedFence = (fenceId: string) => fences.find((f) => f.id === fenceId);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="h-14 bg-bg-secondary border-b border-border-primary flex items-center justify-between px-6">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-primary" />
          处置工单
        </h2>
        <button onClick={() => {
          setNewOrder({
            alertId: '',
            handler: '',
            contact: '',
            status: 'pending',
            measures: { check: null, announcement: null, intercept: null },
            result: '',
          });
          setShowCreateModal(true);
        }} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          新建工单
        </button>
      </div>

      <div className="flex items-center border-b border-border-primary bg-bg-secondary/50 px-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-3 text-sm font-medium transition-colors relative ${
              activeTab === tab.key
                ? `${tab.color} border-b-2 border-current`
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
            <span className="ml-2 text-xs opacity-60">({tabCounts[tab.key]})</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
        {filteredWorkOrders.map((order) => {
          const relatedAlert = getRelatedAlert(order.alertId);
          const relatedTarget = relatedAlert ? getRelatedTarget(relatedAlert.targetId) : null;
          const relatedFence = relatedAlert ? getRelatedFence(relatedAlert.fenceId) : null;
          const isEditing = editingId === order.id;
          const isExpanded = expandedId === order.id;

          return (
            <div key={order.id} className="card overflow-hidden">
              <div
                className="p-4 cursor-pointer hover:bg-bg-tertiary/50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : order.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-primary font-semibold">{order.id}</span>
                    {getStatusBadge(order.status)}
                    {relatedAlert && (
                      <span className={`badge badge-level-${relatedAlert.level}`}>
                        告警等级 {relatedAlert.level}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <span className="text-gray-400 flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {order.handler}
                    </span>
                    <span className="text-gray-400 flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {order.contact}
                    </span>
                    <span className="text-gray-500 text-xs font-mono">
                      {order.createdAt.toLocaleString('zh-CN')}
                    </span>
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-border-primary p-4 bg-bg-tertiary/30 space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    {relatedAlert && (
                      <div className="bg-bg-card rounded-sm p-3 border border-border-primary">
                        <div className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-alert-1" />
                          关联告警
                        </div>
                        <div className="font-mono text-primary mb-1">{relatedAlert.id}</div>
                        <div className="text-xs text-gray-300">{relatedAlert.description}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {relatedAlert.alertTime.toLocaleString('zh-CN')}
                        </div>
                      </div>
                    )}
                    {relatedTarget && (
                      <div className="bg-bg-card rounded-sm p-3 border border-border-primary">
                        <div className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                          <Target className="w-3 h-3 text-primary" />
                          关联目标
                        </div>
                        <div className="font-mono text-primary mb-1">{relatedTarget.id}</div>
                        <div className="text-xs text-gray-300">{relatedTarget.type}</div>
                        <div className="text-xs text-gray-500 font-mono mt-1">
                          H: {relatedTarget.altitude.toFixed(0)}m · V: {relatedTarget.speed.toFixed(1)}m/s
                        </div>
                      </div>
                    )}
                    {relatedFence && (
                      <div className="bg-bg-card rounded-sm p-3 border border-border-primary">
                        <div className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                          <Shield className="w-3 h-3 text-alert-2" />
                          关联围栏
                        </div>
                        <div className="text-white mb-1">{relatedFence.name}</div>
                        <div className="text-xs text-gray-300">
                          {relatedFence.type === 'forbidden' ? '禁飞区' : relatedFence.type === 'height_limit' ? `限高${relatedFence.maxHeight}m` : '临时管控区'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">告警等级 {relatedFence.alertLevel}</div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-bg-card rounded-sm p-3 border border-border-primary">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          处置措施
                        </span>
                        {!isEditing && (order.status === 'pending' || order.status === 'processing') && (
                          <button
                            onClick={() => handleStartEdit(order)}
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            <Edit2 className="w-3 h-3" />
                            编辑
                          </button>
                        )}
                      </div>

                      {isEditing ? (
                        <div className="space-y-2">
                          <div>
                            <label className="text-xs text-gray-400 block mb-1">现场核查</label>
                            <textarea
                              value={editMeasures.check ?? ''}
                              onChange={(e) => setEditMeasures((m) => ({ ...m, check: e.target.value }))}
                              placeholder="现场核查情况（留空可清除）"
                              className="input-field text-sm h-16 resize-none"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-400 block mb-1">喊话驱离</label>
                            <textarea
                              value={editMeasures.announcement ?? ''}
                              onChange={(e) => setEditMeasures((m) => ({ ...m, announcement: e.target.value }))}
                              placeholder="喊话内容与回应（留空可清除）"
                              className="input-field text-sm h-16 resize-none"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-400 block mb-1">拦截处置</label>
                            <textarea
                              value={editMeasures.intercept ?? ''}
                              onChange={(e) => setEditMeasures((m) => ({ ...m, intercept: e.target.value }))}
                              placeholder="拦截设备与结果（留空可清除）"
                              className="input-field text-sm h-16 resize-none"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-400 block mb-1">处置结果</label>
                            <textarea
                              value={editResult}
                              onChange={(e) => setEditResult(e.target.value)}
                              placeholder="最终处置结果"
                              className="input-field text-sm h-16 resize-none"
                            />
                          </div>
                          <div className="flex gap-2 pt-2">
                            <button
                              onClick={() => handleSaveEdit(order.id)}
                              className="btn-success flex items-center gap-1 text-xs py-1.5"
                            >
                              <Save className="w-3 h-3" />
                              保存
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="btn-warning flex items-center gap-1 text-xs py-1.5"
                            >
                              <X className="w-3 h-3" />
                              取消
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="text-gray-400 text-xs">现场核查：</span>
                            <span className="text-gray-200">{order.measures.check || '未填写'}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 text-xs">喊话驱离：</span>
                            <span className="text-gray-200">{order.measures.announcement || '未填写'}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 text-xs">拦截处置：</span>
                            <span className="text-gray-200">{order.measures.intercept || '未填写'}</span>
                          </div>
                          {order.result && (
                            <div className="pt-2 border-t border-border-primary">
                              <span className="text-gray-400 text-xs">处置结果：</span>
                              <span className="text-alert-success font-medium">{order.result}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="bg-bg-card rounded-sm p-3 border border-border-primary">
                      <div className="text-xs text-gray-400 mb-3">状态流转</div>
                      <div className="space-y-2">
                        {(['pending', 'processing', 'completed', 'closed'] as WorkOrderStatus[]).map((s, i) => (
                          <div key={s} className="flex items-center gap-2">
                            <button
                              disabled={isEditing || order.status === s}
                              onClick={() => updateWorkOrderStatus(order.id, s)}
                              className={`flex-1 text-left p-2 rounded-sm text-sm transition-all ${
                                order.status === s
                                  ? s === 'pending' ? 'bg-alert-1/15 border border-alert-1/50 text-alert-1'
                                    : s === 'processing' ? 'bg-alert-2/15 border border-alert-2/50 text-alert-2'
                                    : s === 'completed' ? 'bg-alert-success/15 border border-alert-success/50 text-alert-success'
                                    : 'bg-gray-500/15 border border-gray-500/50 text-gray-400'
                                  : isEditing
                                  ? 'bg-bg-secondary text-gray-600 cursor-not-allowed'
                                  : 'bg-bg-secondary hover:bg-bg-tertiary text-gray-300 cursor-pointer'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <Check className={`w-4 h-4 ${order.status === s ? 'opacity-100' : 'opacity-20'}`} />
                                {s === 'pending' ? '待处置' : s === 'processing' ? '处置中' : s === 'completed' ? '已完成' : '已关闭'}
                              </div>
                            </button>
                            {i < 3 && <div className="w-px h-6 bg-border-primary" />}
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 pt-3 border-t border-border-primary text-xs text-gray-500 space-y-1">
                        <div className="flex justify-between">
                          <span>创建时间</span>
                          <span className="font-mono">{order.createdAt.toLocaleString('zh-CN')}</span>
                        </div>
                        {order.closedAt && (
                          <div className="flex justify-between">
                            <span>关闭时间</span>
                            <span className="font-mono">{order.closedAt.toLocaleString('zh-CN')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredWorkOrders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <ClipboardList className="w-16 h-16 mb-4 opacity-20" />
            <p>暂无工单记录</p>
            <button
              onClick={() => {
                setNewOrder({
                  alertId: '', handler: '', contact: '', status: 'pending',
                  measures: { check: null, announcement: null, intercept: null }, result: '',
                });
                setShowCreateModal(true);
              }}
              className="mt-4 btn-primary"
            >
              创建第一个工单
            </button>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-bg-card border border-border-primary rounded-sm w-[700px] max-h-[85vh] overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-border-primary flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                新建处置工单
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-gray-400 hover:text-white hover:bg-white/5 rounded-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto max-h-[calc(85vh-150px)] scrollbar-thin">
              {prefilledAlert && (
                <div className="bg-bg-secondary/50 border border-primary/30 rounded-sm p-4 space-y-3">
                  <div className="text-xs text-primary font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    自动带出告警背景信息
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <span className="text-gray-400 text-xs block mb-1">告警编号</span>
                      <span className="font-mono text-primary">{prefilledAlert.id}</span>
                      <span className={`ml-2 badge badge-level-${prefilledAlert.level} text-[10px]`}>
                        等级{prefilledAlert.level}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs block mb-1">目标编号</span>
                      <span className="font-mono text-white">{prefilledAlert.targetId}</span>
                      {prefilledTarget && <div className="text-xs text-gray-400">{prefilledTarget.type}</div>}
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs block mb-1">围栏名称</span>
                      <span className="text-white">{prefilledFence?.name || '-'}</span>
                      {prefilledFence && (
                        <div className="text-xs text-gray-400">
                          {prefilledFence.type === 'forbidden' ? '禁飞区' : `限高${prefilledFence.maxHeight}m`}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-400 text-xs block mb-1">告警描述</span>
                    <span className="text-gray-200">{prefilledAlert.description}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 flex items-center gap-1 mb-2">
                    <User className="w-4 h-4" />
                    处置人员 <span className="text-alert-1">*</span>
                  </label>
                  <input
                    type="text"
                    value={newOrder.handler || ''}
                    onChange={(e) => setNewOrder((o) => ({ ...o, handler: e.target.value }))}
                    placeholder="请输入处置人员姓名"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 flex items-center gap-1 mb-2">
                    <Phone className="w-4 h-4" />
                    联系方式 <span className="text-alert-1">*</span>
                  </label>
                  <input
                    type="text"
                    value={newOrder.contact || ''}
                    onChange={(e) => setNewOrder((o) => ({ ...o, contact: e.target.value }))}
                    placeholder="请输入联系电话"
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">关联告警（可选）</label>
                <select
                  value={newOrder.alertId || ''}
                  onChange={(e) => setNewOrder((o) => ({ ...o, alertId: e.target.value }))}
                  className="input-field"
                >
                  <option value="">不关联告警</option>
                  {alerts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.id} - {a.description}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-sm text-gray-400 block">处置措施（留空表示未执行）</label>
                <div>
                  <span className="text-xs text-gray-500 block mb-1">现场核查</span>
                  <textarea
                    value={newOrder.measures?.check ?? ''}
                    onChange={(e) => setNewOrder((o) => ({
                      ...o,
                      measures: { ...o.measures, check: e.target.value || null }
                    }))}
                    placeholder="请填写现场核查情况（留空可清除）"
                    className="input-field h-16 resize-none"
                  />
                </div>
                <div>
                  <span className="text-xs text-gray-500 block mb-1">喊话驱离</span>
                  <textarea
                    value={newOrder.measures?.announcement ?? ''}
                    onChange={(e) => setNewOrder((o) => ({
                      ...o,
                      measures: { ...o.measures, announcement: e.target.value || null }
                    }))}
                    placeholder="请填写喊话内容与回应（留空可清除）"
                    className="input-field h-16 resize-none"
                  />
                </div>
                <div>
                  <span className="text-xs text-gray-500 block mb-1">拦截处置</span>
                  <textarea
                    value={newOrder.measures?.intercept ?? ''}
                    onChange={(e) => setNewOrder((o) => ({
                      ...o,
                      measures: { ...o.measures, intercept: e.target.value || null }
                    }))}
                    placeholder="请填写拦截设备与结果（留空可清除）"
                    className="input-field h-16 resize-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">处置结果</label>
                <textarea
                  value={newOrder.result || ''}
                  onChange={(e) => setNewOrder((o) => ({ ...o, result: e.target.value }))}
                  placeholder="请填写最终处置结果"
                  className="input-field h-16 resize-none"
                />
              </div>
            </div>

            <div className="p-4 border-t border-border-primary flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="btn-warning"
              >
                取消
              </button>
              <button
                onClick={handleSubmitNew}
                disabled={!newOrder.handler || !newOrder.contact}
                className="btn-primary"
              >
                创建工单
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

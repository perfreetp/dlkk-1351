import { useState } from 'react';
import { Shield, Plus, Pencil, Trash2, X, Check, Hexagon, Circle, Square, Clock, AlertTriangle, MapPin } from 'lucide-react';
import { useAppStore } from '@/store';
import MapCanvas from '@/components/Map/MapCanvas';
import type { Fence, FenceType, AlertLevel } from '@/types';
import { fenceTypeLabels } from '@/data/mockData';

export default function FencePage() {
  const { fences, devices, targets, addFence, updateFence, deleteFence, selectedFence, setSelectedFence } = useAppStore();
  const [drawMode, setDrawMode] = useState(false);
  const [drawType, setDrawType] = useState<FenceType>('forbidden');
  const [drawingPoints, setDrawingPoints] = useState<{ lat: number; lng: number }[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editFence, setEditFence] = useState<Fence | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'forbidden' as FenceType,
    maxHeight: 0,
    alertLevel: 1 as AlertLevel,
    startTime: '',
    endTime: '',
  });

  const handleFenceClick = (fence: Fence) => {
    setSelectedFence(fence);
    setEditFence(fence);
    setFormData({
      name: fence.name,
      type: fence.type,
      maxHeight: fence.maxHeight,
      alertLevel: fence.alertLevel,
      startTime: fence.startTime ? fence.startTime.toISOString().slice(0, 16) : '',
      endTime: fence.endTime ? fence.endTime.toISOString().slice(0, 16) : '',
    });
    setShowForm(true);
  };

  const handleDrawComplete = (coordinates: { lat: number; lng: number }[]) => {
    setDrawingPoints(coordinates);
    setShowForm(true);
    setEditFence(null);
    setFormData({
      name: '',
      type: drawType,
      maxHeight: drawType === 'forbidden' ? 0 : 150,
      alertLevel: 1,
      startTime: '',
      endTime: '',
    });
  };

  const handlePointAdd = (point: { lat: number; lng: number }) => {
    setDrawingPoints([...drawingPoints, point]);
  };

  const handleSave = () => {
    if (!formData.name) {
      alert('请输入围栏名称');
      return;
    }
    if (drawingPoints.length < 3 && !editFence) {
      alert('请在地图上至少绘制3个点');
      return;
    }

    const fenceData: Fence = {
      id: editFence?.id || `F-${String(fences.length + 1).padStart(3, '0')}`,
      name: formData.name,
      type: formData.type,
      maxHeight: formData.maxHeight,
      coordinates: editFence ? editFence.coordinates : drawingPoints,
      alertLevel: formData.alertLevel,
      startTime: formData.startTime ? new Date(formData.startTime) : undefined,
      endTime: formData.endTime ? new Date(formData.endTime) : undefined,
    };

    if (editFence) {
      updateFence(fenceData);
    } else {
      addFence(fenceData);
    }

    resetForm();
  };

  const resetForm = () => {
    setShowForm(false);
    setDrawMode(false);
    setDrawingPoints([]);
    setEditFence(null);
    setSelectedFence(null);
    setFormData({
      name: '',
      type: 'forbidden',
      maxHeight: 0,
      alertLevel: 1,
      startTime: '',
      endTime: '',
    });
  };

  const handleDelete = (fenceId: string) => {
    if (confirm('确定要删除这个围栏吗？')) {
      deleteFence(fenceId);
    }
  };

  const startDraw = (type: FenceType) => {
    setDrawType(type);
    setDrawMode(true);
    setDrawingPoints([]);
    setShowForm(false);
    setSelectedFence(null);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="h-14 bg-bg-secondary border-b border-border-primary flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            电子围栏管理
          </h2>
          <span className="text-sm text-gray-400">共 {fences.length} 个围栏</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400 mr-2">新建围栏:</span>
          <button
            onClick={() => startDraw('forbidden')}
            className={`px-3 py-1.5 text-sm rounded-sm transition-all flex items-center gap-1 ${
              drawMode && drawType === 'forbidden'
                ? 'bg-alert-1/20 text-alert-1 border border-alert-1'
                : 'bg-transparent text-gray-300 border border-border-primary hover:border-alert-1 hover:text-alert-1'
            }`}
          >
            <Hexagon className="w-4 h-4" />
            禁飞区
          </button>
          <button
            onClick={() => startDraw('height_limit')}
            className={`px-3 py-1.5 text-sm rounded-sm transition-all flex items-center gap-1 ${
              drawMode && drawType === 'height_limit'
                ? 'bg-alert-2/20 text-alert-2 border border-alert-2'
                : 'bg-transparent text-gray-300 border border-border-primary hover:border-alert-2 hover:text-alert-2'
            }`}
          >
            <Circle className="w-4 h-4" />
            限高区
          </button>
          <button
            onClick={() => startDraw('temporary')}
            className={`px-3 py-1.5 text-sm rounded-sm transition-all flex items-center gap-1 ${
              drawMode && drawType === 'temporary'
                ? 'bg-alert-3/20 text-alert-3 border border-alert-3'
                : 'bg-transparent text-gray-300 border border-border-primary hover:border-alert-3 hover:text-alert-3'
            }`}
          >
            <Square className="w-4 h-4" />
            临时管控
          </button>
          {drawMode && (
            <button
              onClick={resetForm}
              className="px-3 py-1.5 text-sm rounded-sm bg-gray-500/20 text-gray-300 border border-gray-500 hover:bg-gray-500/30 transition-all flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              取消绘制
            </button>
          )}
        </div>
      </div>

      {drawMode && (
        <div className="bg-primary/10 border-b border-primary/30 px-6 py-2">
          <p className="text-sm text-primary">
            提示：在地图上点击添加顶点，双击完成绘制。当前绘制：{fenceTypeLabels[drawType]}，已添加 {drawingPoints.length} 个点
          </p>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 relative">
          <MapCanvas
            targets={[]}
            fences={fences}
            devices={devices}
            showCoverage={false}
            onFenceClick={handleFenceClick}
            selectedFenceId={selectedFence?.id}
            drawMode={drawMode}
            onDrawComplete={handleDrawComplete}
            drawingPoints={drawingPoints}
            onDrawingPointAdd={handlePointAdd}
          />

          <div className="absolute bottom-4 left-4 bg-bg-card/90 backdrop-blur border border-border-primary rounded-sm p-3">
            <div className="text-xs text-gray-400 space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded border border-alert-1 bg-alert-1/20" />
                <span>禁飞区 - 禁止任何飞行</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded border border-alert-2 bg-alert-2/20" />
                <span>限高区 - 限制飞行高度</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded border border-alert-3 bg-alert-3/20" />
                <span>临时管控 - 有有效期</span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-96 border-l border-border-primary flex flex-col bg-bg-secondary/50 overflow-hidden">
          {showForm ? (
            <div className="p-4 overflow-y-auto scrollbar-thin">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  {editFence ? '编辑围栏' : '新建围栏'}
                </h3>
                <button
                  onClick={resetForm}
                  className="p-1 text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">围栏名称</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field"
                    placeholder="请输入围栏名称"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">围栏类型</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as FenceType })}
                    className="input-field"
                  >
                    <option value="forbidden">禁飞区</option>
                    <option value="height_limit">限高区</option>
                    <option value="temporary">临时管控区</option>
                  </select>
                </div>

                {formData.type !== 'forbidden' && (
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">限制高度 (米)</label>
                    <input
                      type="number"
                      value={formData.maxHeight}
                      onChange={(e) => setFormData({ ...formData, maxHeight: Number(e.target.value) })}
                      className="input-field"
                      min="0"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs text-gray-400 mb-1">告警等级</label>
                  <select
                    value={formData.alertLevel}
                    onChange={(e) => setFormData({ ...formData, alertLevel: Number(e.target.value) as AlertLevel })}
                    className="input-field"
                  >
                    <option value={1}>一级 - 紧急</option>
                    <option value={2}>二级 - 重要</option>
                    <option value={3}>三级 - 一般</option>
                  </select>
                </div>

                {formData.type === 'temporary' && (
                  <>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">生效时间</label>
                      <input
                        type="datetime-local"
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">失效时间</label>
                      <input
                        type="datetime-local"
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                        className="input-field"
                      />
                    </div>
                  </>
                )}

                {!editFence && (
                  <div className="bg-bg-tertiary p-3 rounded-sm">
                    <div className="text-xs text-gray-400 mb-2">已绘制顶点</div>
                    <div className="text-sm text-white font-mono">
                      {drawingPoints.length} 个点
                    </div>
                    {drawingPoints.length > 0 && (
                      <button
                        onClick={() => setDrawingPoints([])}
                        className="text-xs text-alert-1 hover:underline mt-2"
                      >
                        清除重绘
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-6">
                <button onClick={handleSave} className="btn-primary flex-1 flex items-center justify-center gap-1">
                  <Check className="w-4 h-4" />
                  保存
                </button>
                <button onClick={resetForm} className="btn-danger flex-1">
                  取消
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="p-3 border-b border-border-primary">
                <h3 className="text-sm font-semibold text-primary">围栏列表</h3>
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-2">
                {fences.map((fence) => (
                  <div
                    key={fence.id}
                    className={`p-3 rounded-sm border transition-all cursor-pointer ${
                      selectedFence?.id === fence.id
                        ? 'bg-primary/10 border-primary'
                        : 'bg-bg-card border-border-primary hover:border-primary/50'
                    }`}
                    onClick={() => handleFenceClick(fence)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`badge ${
                          fence.type === 'forbidden' ? 'badge-level-1' :
                          fence.type === 'height_limit' ? 'badge-level-2' : 'badge-level-3'
                        }`}>
                          {fenceTypeLabels[fence.type]}
                        </span>
                        <span className="text-white font-medium">{fence.name}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(fence.id);
                        }}
                        className="p-1 text-gray-400 hover:text-alert-1 hover:bg-alert-1/10 rounded-sm transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-xs text-gray-400 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          告警等级 {fence.alertLevel}
                        </span>
                        {fence.type !== 'forbidden' && (
                          <span>限高 {fence.maxHeight}m</span>
                        )}
                      </div>
                      {fence.startTime && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {fence.startTime.toLocaleDateString('zh-CN')} - {fence.endTime?.toLocaleDateString('zh-CN')}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span>{fence.coordinates.length} 个顶点</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

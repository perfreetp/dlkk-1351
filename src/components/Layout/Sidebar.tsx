import { NavLink } from 'react-router-dom';
import { Radar, AlertTriangle, Crosshair, Shield, ClipboardList, Cpu, BarChart3 } from 'lucide-react';

const menuItems = [
  { path: '/dashboard', label: '态势大屏', icon: Radar },
  { path: '/alerts', label: '告警列表', icon: AlertTriangle },
  { path: '/fence', label: '电子围栏', icon: Shield },
  { path: '/workorders', label: '处置工单', icon: ClipboardList },
  { path: '/devices', label: '设备管理', icon: Cpu },
  { path: '/statistics', label: '统计报表', icon: BarChart3 },
];

export default function Sidebar() {
  return (
    <aside className="w-56 bg-bg-secondary border-r border-border-primary flex flex-col">
      <div className="p-4 border-b border-border-primary">
        <h1 className="text-xl font-bold text-primary glow-text flex items-center gap-2">
          <Crosshair className="w-6 h-6" />
          <span>低空监管系统</span>
        </h1>
        <p className="text-xs text-gray-500 mt-1">无人机黑飞检测平台</p>
      </div>
      
      <nav className="flex-1 p-3 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-sm transition-all duration-300 text-sm ${
                isActive
                  ? 'bg-primary/15 text-primary border-l-2 border-primary shadow-glow-primary'
                  : 'text-gray-400 hover:text-white hover:bg-primary/5'
              }`
            }
          >
            <item.icon className="w-4 h-4" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      
      <div className="p-4 border-t border-border-primary">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/50">
            <span className="text-primary text-sm font-medium">管</span>
          </div>
          <div>
            <p className="text-sm text-white">管理员</p>
            <p className="text-xs text-gray-500">admin@park.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

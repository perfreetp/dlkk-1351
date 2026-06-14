import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '@/components/Layout/MainLayout';
import Dashboard from '@/pages/Dashboard/Dashboard';
import Alerts from '@/pages/Alerts/Alerts';
import TargetDetail from '@/pages/TargetDetail/TargetDetail';
import Fence from '@/pages/Fence/Fence';
import WorkOrders from '@/pages/WorkOrders/WorkOrders';
import Devices from '@/pages/Devices/Devices';
import Statistics from '@/pages/Statistics/Statistics';
import Review from '@/pages/Review/Review';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="target/:id" element={<TargetDetail />} />
          <Route path="fence" element={<Fence />} />
          <Route path="workorders" element={<WorkOrders />} />
          <Route path="devices" element={<Devices />} />
          <Route path="statistics" element={<Statistics />} />
          <Route path="review" element={<Review />} />
        </Route>
      </Routes>
    </Router>
  );
}

import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Airdrops from './pages/Airdrops';
import AirdropDetail from './pages/AirdropDetail';
import Profile from './pages/Profile';
import Subscribe from './pages/Subscribe';
import ReferralLanding from './pages/ReferralLanding';
import Navbar from './components/Navbar';
import AdminLayout from './pages/admin/AdminLayout';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminAirdrops from './pages/admin/AdminAirdrops';
import AdminUsers from './pages/admin/AdminUsers';
import AdminPayments from './pages/admin/AdminPayments';

export default function App() {
  return (
    <Routes>
      {/* Admin routes — no main Navbar */}
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/admin/*" element={<AdminLayout />}>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="airdrops" element={<AdminAirdrops />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="payments" element={<AdminPayments />} />
      </Route>

      {/* Referral landing — standalone page */}
      <Route path="/ref/:code" element={<ReferralLanding />} />

      {/* Public routes */}
      <Route path="*" element={
        <div className="min-h-screen bg-background">
          <Navbar />
          <main className="max-w-6xl mx-auto px-4 py-6">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/airdrops" element={<Airdrops />} />
              <Route path="/airdrops/:id" element={<AirdropDetail />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/subscribe" element={<Subscribe />} />
              <Route path="*" element={<Home />} />
            </Routes>
          </main>
        </div>
      } />
    </Routes>
  );
}

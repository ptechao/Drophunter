import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Airdrops from './pages/Airdrops';
import AirdropDetail from './pages/AirdropDetail';
import Navbar from './components/Navbar';

export default function App() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/airdrops" element={<Airdrops />} />
          <Route path="/airdrops/:id" element={<AirdropDetail />} />
        </Routes>
      </main>
    </div>
  );
}

import { Outlet } from 'react-router-dom';
import Navbar from '../Navbar';
import Footer from '../Footer';

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-mimu-cream dark:bg-[#121212] flex flex-col">
      <Navbar />
      <main className="flex-grow pt-28 sm:pt-32 pb-16 px-4">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

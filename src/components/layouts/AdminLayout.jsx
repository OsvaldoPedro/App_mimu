import { Outlet } from 'react-router-dom';
import AdminSidebar from '../AdminSidebar';

export default function AdminLayout() {
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-mimu-cream dark:bg-[#121212]">
      <AdminSidebar />
      <div className="flex-1 p-4 sm:p-6 md:p-8 w-full">
        <Outlet />
      </div>
    </div>
  );
}

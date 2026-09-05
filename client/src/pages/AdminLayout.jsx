import { Outlet } from 'react-router-dom';


export default function AdminLayout() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Admin Dashboard</h1>
      <div className="flex gap-2 mb-6 border-b border-gray-200">
      </div>
      <Outlet />
    </div>
  );
}

import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, Wrench, Settings } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function AdminLayout() {
  const location = useLocation();

  const navItems = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/products', label: 'Products', icon: Package },
    { to: '/admin/services', label: 'Services', icon: Wrench },
    { to: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-primary-900 text-white min-h-screen fixed left-0 top-0">
          <div className="p-6">
            <img
              src="/logo.svg"
              alt="Malhotra Automobiles"
              className="w-48 h-32 object-contain rounded-md bg-black mx-auto mb-4 ring-2 ring-accent/50"
            />
            <h1 className="text-lg font-bold text-center">Admin Panel</h1>
          </div>
          <nav className="px-4 space-y-1">
            {navItems.map(({ to, label, icon: Icon }) => {
              const isActive = location.pathname === to || location.pathname.startsWith(to + '/');
              return (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'text-gray-300 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <Icon size={18} />
                  {label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 ml-64 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

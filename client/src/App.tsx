import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, User, LogOut } from 'lucide-react';
import { useAuthStore } from './stores/authStore';
import { signout, getMe } from './lib/api';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSettings } from './lib/api';
import type { BusinessSettings } from './types';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/services', label: 'Services' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, isAuthenticated, isAdmin, setUser, setToken, setInitialized, signout: authSignout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: settings } = useQuery({
    queryKey: ['business-settings'],
    queryFn: () => getSettings().then((res) => res.data as BusinessSettings),
  });

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      getMe()
        .then((res) => {
          if (res.data?.profile) {
            setUser(res.data.profile);
            setToken(token);
          } else {
            localStorage.removeItem('auth_token');
            setToken(null);
            setUser(null);
          }
        })
        .catch(() => {
          localStorage.removeItem('auth_token');
          setToken(null);
          setUser(null);
        })
        .finally(() => {
          setInitialized(true);
        });
    } else {
      setInitialized(true);
    }
  }, [setInitialized, setToken, setUser]);

  const handleSignout = async () => {
    try {
      await signout();
    } catch {
      // ignore server errors on signout
    }
    authSignout();
    setUser(null);
    setToken(null);
    navigate('/');
    setUserMenuOpen(false);
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center shrink-0" aria-label="Malhotra Automobiles home">
              <img
                src="/logo.jpeg"
                alt="Malhotra Automobiles Chandausi, established 1977"
                className="h-14 w-24 object-contain rounded-md bg-black ring-2 ring-accent/20"
              />
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(to)
                      ? 'text-accent bg-accent/10'
                      : 'text-gray-600 hover:text-primary-900 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </Link>
              ))}
              {isAuthenticated && isAdmin && (
                <Link
                  to="/admin"
                  className={`ml-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/admin')
                      ? 'text-accent bg-accent/10'
                      : 'text-gray-600 hover:text-primary-900 hover:bg-gray-50'
                  }`}
                >
                  Admin
                </Link>
              )}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  {/* User menu */}
                  <div className="relative">
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center gap-2 p-2 text-gray-600 hover:text-primary-900"
                    >
                      <User size={20} />
                      <span className="hidden sm:block text-sm">{user?.name}</span>
                    </button>

                    {userMenuOpen && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                        {isAdmin && (
                          <Link
                            to="/admin"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            Admin Dashboard
                          </Link>
                        )}
                        <Link
                          to="/my-requests"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          My Requests
                        </Link>
                        <Link
                          to="/my-vehicles"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          My Vehicles
                        </Link>
                        <button
                          onClick={handleSignout}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <LogOut size={16} /> Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-2 bg-primary-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-800 transition-colors"
                >
                  <User size={18} /> Sign In
                </Link>
              )}

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden p-2 text-gray-600"
                aria-label="Toggle menu"
              >
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4 px-4 space-y-1">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive(to)
                    ? 'text-accent bg-accent/10'
                    : 'text-gray-600 hover:text-primary-900 hover:bg-gray-50'
                }`}
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </Link>
            ))}
            {isAuthenticated && isAdmin && (
              <Link
                to="/admin"
                className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/admin')
                    ? 'text-accent bg-accent/10'
                    : 'text-gray-600 hover:text-primary-900 hover:bg-gray-50'
                }`}
                onClick={() => setMenuOpen(false)}
              >
                Admin
              </Link>
            )}
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-primary-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <img
                src="/logo.jpeg"
                alt="Malhotra Automobiles Chandausi"
                className="h-28 w-36 object-contain rounded-md bg-black mb-4 ring-2 ring-accent/30"
              />
              <h3 className="font-bold text-lg mb-4">{settings?.business_name || 'Malhotra Automobiles'}</h3>
              <p className="text-gray-400 text-sm">Your trusted local automobile parts and service expert.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/services" className="hover:text-white">Services</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>{settings?.email || 'info@malhotraautomobiles.com'}</li>
                <li>{settings?.phone || '+91 XXXXX XXXXX'}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Hours</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>{settings?.weekday_hours || 'Mon-Sat: 9AM - 7PM'}</li>
                <li>{settings?.sunday_hours || 'Sunday: Closed'}</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-primary-800 text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Malhotra Automobiles. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

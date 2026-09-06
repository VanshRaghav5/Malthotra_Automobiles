import { Outlet, Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, MessageCircle, Menu, X } from 'lucide-react';
import { useCartStore } from './stores/cartStore';
import { useState } from 'react';

export default function App() {
  const cartCount = useCartStore((s) => s.items.length);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="text-xl font-bold text-primary-900">
              Malhotra Automobiles
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-8">
              <Link to="/products" className="text-gray-600 hover:text-primary-900">Products</Link>
              <Link to="/services" className="text-gray-600 hover:text-primary-900">Services</Link>
              <Link to="/about" className="text-gray-600 hover:text-primary-900">About</Link>
              <Link to="/contact" className="text-gray-600 hover:text-primary-900">Contact</Link>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/chat')}
                className="p-2 text-gray-600 hover:text-primary-900"
                aria-label="Chat"
              >
                <MessageCircle size={20} />
              </button>
              <Link
                to="/cart"
                className="relative p-2 text-gray-600 hover:text-primary-900"
                aria-label={`Cart (${cartCount} items)`}
              >
                <ShoppingCart size={20} />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-accent text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
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
          <div className="md:hidden border-t border-gray-200 py-4 px-4 space-y-3">
            <Link to="/products" className="block text-gray-600" onClick={() => setMenuOpen(false)}>Products</Link>
            <Link to="/services" className="block text-gray-600" onClick={() => setMenuOpen(false)}>Services</Link>
            <Link to="/about" className="block text-gray-600" onClick={() => setMenuOpen(false)}>About</Link>
            <Link to="/contact" className="block text-gray-600" onClick={() => setMenuOpen(false)}>Contact</Link>
          </div>
        )}
      </header>

      <main>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-primary-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4">Malhotra Automobiles</h3>
              <p className="text-gray-400 text-sm">Your trusted local automobile parts and service expert.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/products" className="hover:text-white">Products</Link></li>
                <li><Link to="/services" className="hover:text-white">Services</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>info@malhotraautomobiles.com</li>
                <li>+91 XXXXX XXXXX</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Hours</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Mon-Sat: 9AM - 7PM</li>
                <li>Sunday: Closed</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-primary-800 text-center text-sm text-gray-500">
            © {new Date().getFullYear()} Malhotra Automobiles. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

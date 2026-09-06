import { useAuthStore } from '../stores/authStore';
import { Car } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MyVehiclesPage() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <Car size={48} className="mx-auto text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-primary-900 mb-4">Sign in to view your vehicles</h1>
        <p className="text-gray-500 mb-6">You need an account to manage your vehicles.</p>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 bg-accent text-white px-6 py-3 rounded-lg font-medium hover:bg-accent-hover"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-primary-900 mb-8">My Vehicles</h1>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <p className="text-sm text-blue-700">
          Welcome back, <strong>{user?.name}</strong>. Your vehicle history will appear here. Vehicles are automatically tracked when you submit requests.
        </p>
      </div>
    </div>
  );
}

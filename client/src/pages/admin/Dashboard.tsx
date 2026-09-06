import { useQuery } from '@tanstack/react-query';
import { getDashboard } from '../../lib/api';
import { Package, Clock, MessagesSquare, TrendingUp } from 'lucide-react';

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => getDashboard().then((r) => r.data),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse bg-white rounded-xl h-32" />
        ))}
      </div>
    );
  }

  const stats = [
    { label: 'Pending Requests', value: data?.pendingRequests || 0, icon: Clock, color: 'text-yellow-600' },
    { label: "Today's Bookings", value: data?.todayBookings || 0, icon: Package, color: 'text-blue-600' },
    { label: 'Unread Chats', value: data?.unreadConversations || 0, icon: MessagesSquare, color: 'text-green-600' },
    { label: 'Published Products', value: data?.productCount || 0, icon: TrendingUp, color: 'text-purple-600' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary-900 mb-8">Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <Icon className={color} size={24} />
              <span className="text-3xl font-bold text-primary-900">{value}</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

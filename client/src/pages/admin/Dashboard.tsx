import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getDashboard, getAdminRequests, updateRequestStatus } from '../../lib/api';
import { Package, Clock, MessagesSquare, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import type { Request } from '../../types';

const statusColors: Record<string, string> = {
  submitted: 'bg-yellow-100 text-yellow-700',
  under_review: 'bg-blue-100 text-blue-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  ready_for_visit: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-700',
};

type StatItem = { label: string; value: number; icon: typeof Package; color: string };

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => getDashboard().then((r) => r.data),
  });

  const { data: requestsData, isLoading: loadingRequests } = useQuery({
    queryKey: ['admin-requests', statusFilter],
    queryFn: () => getAdminRequests({ status: statusFilter || undefined }).then((r) => r.data),
  });

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateRequestStatus(id, newStatus);
      queryClient.invalidateQueries({ queryKey: ['admin-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update status');
    }
  };

  if (loadingStats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse bg-white rounded-xl h-32" />
        ))}
      </div>
    );
  }

  const statsItems: StatItem[] = [
    { label: 'Pending Requests', value: stats?.pendingRequests || 0, icon: Clock, color: 'text-yellow-600' },
    { label: "Today's Bookings", value: stats?.todayBookings || 0, icon: Package, color: 'text-blue-600' },
    { label: 'Unread Chats', value: stats?.unreadConversations || 0, icon: MessagesSquare, color: 'text-green-600' },
    { label: 'Published Products', value: stats?.productCount || 0, icon: TrendingUp, color: 'text-purple-600' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary-900 mb-8">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        {statsItems.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <Icon className={color} size={24} />
              <span className="text-3xl font-bold text-primary-900">{value}</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-primary-900">Recent Requests</h2>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {loadingRequests ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-gray-100 h-16 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {requestsData?.data?.map((req: Request & { profiles?: { name: string; email: string } }) => (
              <div key={req.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-sm text-gray-500">{req.request_number}</span>
                    <div>
                      <p className="font-medium text-primary-900 text-sm">
                        {req.profiles?.name || 'Guest'}
                      </p>
                      <p className="text-xs text-gray-500">{req.profiles?.email || ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[req.status]}`}>
                      {req.status.replace('_', ' ')}
                    </span>
                    <span className="text-sm text-gray-500">
                      ${req.estimated_total?.toFixed(2) || '0.00'}
                    </span>
                    <button
                      onClick={() => setExpandedId(expandedId === req.id ? null : req.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {expandedId === req.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {expandedId === req.id && (
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3">
                    <span className="text-sm text-gray-500">Update status:</span>
                    <select
                      value={req.status}
                      onChange={(e) => handleStatusChange(req.id, e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                      <option value="submitted">Submitted</option>
                      <option value="under_review">Under Review</option>
                      <option value="accepted">Accepted</option>
                      <option value="rejected">Rejected</option>
                      <option value="ready_for_visit">Ready for Visit</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                )}
              </div>
            ))}

            {requestsData?.data?.length === 0 && (
              <div className="p-12 text-center text-gray-500">No requests found</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { getMyRequests, getConversations } from '../lib/api';
import { Package, Clock, MessageSquare, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Request } from '../types';

const statusColors: Record<string, string> = {
  submitted: 'bg-yellow-100 text-yellow-700',
  under_review: 'bg-blue-100 text-blue-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  ready_for_visit: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-700',
};

export default function MyRequestsPage() {
  const { isAuthenticated, user } = useAuthStore();

  const { data: requests, isLoading: loadingRequests } = useQuery({
    queryKey: ['my-requests'],
    queryFn: () => getMyRequests().then((r) => (r.data as Request[]) || []),
    enabled: isAuthenticated,
  });

  const { data: conversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => getConversations().then((r) => r.data || []),
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <Package size={48} className="mx-auto text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-primary-900 mb-4">Sign in to view your requests</h1>
        <p className="text-gray-500 mb-6">You need an account to track your requests.</p>
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
      <h1 className="text-2xl font-bold text-primary-900 mb-6">My Requests & Orders</h1>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <p className="text-sm text-blue-700">
          Welcome back, <strong>{user?.name}</strong>. Here are your submitted product requests and service bookings.
        </p>
      </div>

      {/* Requests Section */}
      <div className="mb-10">
        <h2 className="text-lg font-semibold text-primary-900 mb-4">Submitted Requests</h2>

        {loadingRequests ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-gray-100 h-24 rounded-xl" />
            ))}
          </div>
        ) : requests && requests.length > 0 ? (
          <div className="space-y-4">
            {requests.map((req: any) => (
              <div key={req.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-semibold text-primary-900">{req.request_number}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[req.status] || 'bg-gray-100'}`}>
                      {req.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock size={14} /> {new Date(req.created_at).toLocaleDateString()}
                    </span>
                    <span className="font-bold text-primary-900">
                      ${req.estimated_total?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                </div>

                {req.request_items?.length > 0 && (
                  <p className="text-xs text-gray-500 mb-1">
                    Products: {req.request_items.map((it: any) => `${it.products?.name || 'Item'} (×${it.quantity})`).join(', ')}
                  </p>
                )}

                {req.request_services?.length > 0 && (
                  <p className="text-xs text-gray-500 mb-1">
                    Services: {req.request_services.map((sv: any) => sv.services?.name || 'Service').join(', ')}
                  </p>
                )}

                <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end">
                  <Link
                    to={`/request/${req.request_number}`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:text-accent-hover"
                  >
                    View Details <ChevronRight size={16} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <Package size={36} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500 text-sm mb-4">You haven&apos;t submitted any requests yet.</p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent-hover"
            >
              Browse Products
            </Link>
          </div>
        )}
      </div>

      {/* Conversations Section */}
      {conversations && conversations.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-primary-900 mb-4 flex items-center gap-2">
            <MessageSquare size={18} /> Support Conversations
          </h2>
          <div className="space-y-3">
            {conversations.map((conv: any) => (
              <div key={conv.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-primary-900 text-sm">
                    {conv.status === 'open' ? 'Open Support Chat' : conv.status === 'closed' ? 'Closed Chat' : 'Archived'}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Updated {new Date(conv.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <Link to="/chat" className="text-accent hover:text-accent-hover text-sm font-medium">
                  Open Chat
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

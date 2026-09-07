import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getRequest } from '../lib/api';
import { CheckCircle, Package, Wrench } from 'lucide-react';

const statusColors: Record<string, string> = {
  submitted: 'bg-yellow-100 text-yellow-700',
  under_review: 'bg-blue-100 text-blue-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  ready_for_visit: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-700',
};

export default function RequestSuccessPage() {
  const { number } = useParams<{ number: string }>();

  const { data: request, isLoading } = useQuery({
    queryKey: ['request', number],
    queryFn: () => getRequest(number!).then((r) => r.data),
    enabled: !!number,
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="animate-pulse bg-gray-100 h-64 rounded-xl" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-primary-900">Request not found</h1>
        <Link to="/" className="text-accent mt-4 inline-block">Back to Home</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="text-green-600" size={40} />
        </div>
        <h1 className="text-3xl font-bold text-primary-900">Request Submitted!</h1>
        <p className="text-gray-500 mt-2">Your request number is</p>
        <p className="text-2xl font-bold text-accent mt-1">{request.request_number}</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <div className="flex justify-between items-center pb-4 border-b border-gray-100">
          <span className="text-gray-500">Status</span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[request.status] || 'bg-gray-100'}`}>
            {request.status.replace('_', ' ')}
          </span>
        </div>

        {request.estimated_total !== null && (
          <div className="flex justify-between items-center pb-4 border-b border-gray-100">
            <span className="text-gray-500">Estimated Total</span>
            <span className="font-bold text-primary-900">₹{request.estimated_total.toFixed(2)}</span>
          </div>
        )}

        {request.request_items?.length > 0 && (
          <div className="pb-4 border-b border-gray-100">
            <div className="flex items-center gap-2 text-gray-500 mb-3">
              <Package size={16} /> Products
            </div>
            <ul className="space-y-2">
              {request.request_items.map((item: any) => (
                <li key={item.id} className="flex justify-between text-sm">
                  <span>{item.products?.name || item.product_id} x{item.quantity}</span>
                  <span className="font-medium">₹{(item.unit_price_snapshot * item.quantity).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {request.request_services?.length > 0 && (
          <div>
            <div className="flex items-center gap-2 text-gray-500 mb-3">
              <Wrench size={16} /> Services
            </div>
            <ul className="space-y-2">
              {request.request_services.map((svc: any) => (
                <li key={svc.id} className="flex justify-between text-sm">
                  <span>{svc.services?.name || svc.service_id}</span>
                  {svc.availability_slots?.start_time && (
                    <span className="text-gray-500">
                      {svc.availability_slots.date} at {svc.availability_slots.start_time}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {request.notes && (
          <div className="pt-4 border-t border-gray-100">
            <p className="text-gray-500 text-sm">Notes: {request.notes}</p>
          </div>
        )}
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500 mb-4">
          We&apos;ll review your request and get back to you shortly. You can also{' '}
          <Link to="/chat" className="text-accent hover:underline">chat with us</Link> for any questions.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-primary-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-800 transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}

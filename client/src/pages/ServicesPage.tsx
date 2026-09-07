import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getServices } from '../lib/api';
import type { Service } from '../types';
import { Calendar, Clock } from 'lucide-react';

export default function ServicesPage() {
  const { data: services, isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => getServices().then((r) => r.data || []),
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-primary-900 mb-8">Our Services</h1>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-100 rounded-xl h-64" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services?.map((service: Service) => (
            <div key={service.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="aspect-video bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                <Calendar size={32} className="text-gray-400" />
              </div>
              <h2 className="text-xl font-semibold text-primary-900">{service.name}</h2>
              <div className="flex items-center gap-4 mt-2 text-gray-500 text-sm">
                <span className="flex items-center gap-1"><Clock size={14} /> {service.duration_minutes} min</span>
                <span className="text-accent font-bold text-lg">₹{service.price.toFixed(2)}</span>
              </div>
              {service.description && (
                <p className="text-sm text-gray-500 mt-3 line-clamp-2">{service.description}</p>
              )}
              <Link
                to={`/services/book/${service.slug}`}
                className="mt-4 block w-full py-2 bg-primary-900 text-white text-center rounded-lg font-medium hover:bg-primary-800 transition-colors"
              >
                Book Now
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

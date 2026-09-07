import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getServices } from '../lib/api';
import type { Service } from '../types';
import { Calendar, Clock, Search } from 'lucide-react';

export default function ServicesPage() {
  const { data: services, isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => getServices().then((r) => r.data || []),
  });

  const [search, setSearch] = useState('');

  const filtered = services?.filter((s: Service) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.description || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-primary-900 mb-6">Our Services</h1>

      {/* Search bar */}
      <div className="relative mb-8 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search services..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-white"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-100 rounded-xl h-64" />
          ))}
        </div>
      ) : filtered && filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((service: Service) => (
            <div key={service.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="aspect-video bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                <Calendar size={32} className="text-gray-400" />
              </div>
              <h2 className="text-lg font-semibold text-primary-900">{service.name}</h2>
              <div className="flex items-center gap-4 mt-2 text-gray-500 text-sm">
                <span className="flex items-center gap-1"><Clock size={14} /> {service.duration_minutes} min</span>
                <span className="text-accent font-bold">₹{service.price.toFixed(2)}</span>
              </div>
              {service.description && (
                <p className="text-sm text-gray-500 mt-3 line-clamp-2">{service.description}</p>
              )}
              <Link
                to={`/services/book/${service.slug}`}
                className="mt-4 block w-full py-2 bg-primary-900 text-white text-center rounded-lg text-sm font-medium hover:bg-primary-800 transition-colors"
              >
                Book Now
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">
            {search ? 'No services match your search.' : 'No services available yet.'}
          </p>
        </div>
      )}
    </div>
  );
}

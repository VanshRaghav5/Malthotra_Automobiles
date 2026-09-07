import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getServices } from '../lib/api';
import type { Service } from '../types';
import { Calendar, Clock, Search } from 'lucide-react';

const SERVICE_IMAGE_URL = 'https://rlmmyueiqqegelkvxjxa.supabase.co/storage/v1/object/public/product-images';

export default function ServicesPage() {
  const { data: services, isLoading } = useQuery({
    queryKey: ['all-services'],
    queryFn: () => getServices().then((r) => r.data || []),
    staleTime: 1000 * 60 * 5,
  });

  const [search, setSearch] = useState('');

  // Filter services based on search
  const filtered = useMemo(() => {
    if (!search.trim()) return services;
    const query = search.toLowerCase();
    return services?.filter((s: Service) =>
      s.name.toLowerCase().includes(query) ||
      (s.description || '').toLowerCase().includes(query)
    );
  }, [services, search]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-primary-900 mb-4 sm:mb-6">Our Services</h1>

      {/* Search bar */}
      <div className="relative mb-6 sm:mb-8 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search services..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-white text-sm sm:text-base"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-100 rounded-xl h-64" />
          ))}
        </div>
      ) : filtered && filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filtered.map((service: Service) => (
            <div key={service.id} className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 hover:shadow-md transition-shadow">
              <div className="aspect-video bg-gray-100 rounded-lg mb-4 overflow-hidden flex items-center justify-center">
                {service.image ? (
                  <img
                    src={`${SERVICE_IMAGE_URL}/${service.image}`}
                    alt={service.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <Calendar size={32} className="text-gray-400" />
                )}
              </div>
              <h2 className="text-base sm:text-lg font-semibold text-primary-900">{service.name}</h2>
              <div className="flex items-center gap-3 sm:gap-4 mt-2 text-gray-500 text-xs sm:text-sm">
                <span className="flex items-center gap-1"><Clock size={14} /> {service.duration_minutes} min</span>
                <span className="text-accent font-bold">₹{service.price.toFixed(2)}</span>
              </div>
              {service.description && (
                <p className="text-sm text-gray-500 mt-2 sm:mt-3 line-clamp-2">{service.description}</p>
              )}
              <Link
                to={`/services/book/${service.slug}`}
                className="mt-3 sm:mt-4 block w-full py-2 bg-primary-900 text-white text-center rounded-lg text-sm font-medium hover:bg-primary-800 transition-colors touch-manipulation"
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

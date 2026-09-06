import { Link } from 'react-router-dom';
import { ArrowRight, Car, Wrench, ShieldCheck, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getProducts, getServices } from '../lib/api';
import type { Product, Service } from '../types';

export default function HomePage() {
  const { data: products } = useQuery({
    queryKey: ['featured-products'],
    queryFn: () => getProducts({}).then((r) => r.data?.filter((p: Product) => p.featured).slice(0, 4) || []),
  });

  const { data: services } = useQuery({
    queryKey: ['services'],
    queryFn: () => getServices().then((r) => r.data?.slice(0, 4) || []),
  });

  return (
    <div>
      {/* Hero */}
      <section className="bg-primary-900 text-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-accent font-medium mb-4">Professional Auto Parts & Service</p>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
                Everything Your Vehicle Needs, Under One Roof.
              </h1>
              <p className="text-gray-300 text-lg mb-8">
                Genuine parts, expert service, and convenient booking — all from your trusted local automobile partner.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Browse Products <ArrowRight size={18} />
                </Link>
                <Link
                  to="/services"
                  className="inline-flex items-center gap-2 bg-white text-primary-900 hover:bg-gray-100 px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Book a Service
                </Link>
              </div>
            </div>
            <div className="hidden md:flex justify-center">
              <div className="w-80 h-64 bg-primary-800 rounded-2xl flex items-center justify-center">
                <Car size={80} className="text-gray-600" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Strip */}
      <section className="bg-gray-50 py-8 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { icon: ShieldCheck, label: 'Genuine Products' },
              { icon: Wrench, label: 'Expert Service' },
              { icon: Clock, label: 'Convenient Booking' },
              { icon: Car, label: 'Trusted Support' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-2">
                <Icon className="text-accent" size={24} />
                <span className="text-sm font-medium text-gray-700">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {products && products.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-primary-900">Featured Products</h2>
              <Link to="/products" className="text-accent hover:text-accent-hover font-medium flex items-center gap-1">
                View All <ArrowRight size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {products.slice(0, 4).map((product: Product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Services */}
      {services && services.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-primary-900">Our Services</h2>
              <Link to="/services" className="text-accent hover:text-accent-hover font-medium flex items-center gap-1">
                View All <ArrowRight size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {services.map((service: Service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <Link to={`/products/${product.slug}`} className="group block bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-square bg-gray-100 flex items-center justify-center">
        <Car size={40} className="text-gray-400" />
      </div>
      <div className="p-4">
        <p className="text-xs text-gray-500">{product.brand}</p>
        <h3 className="font-medium text-primary-900 mt-1 line-clamp-2 group-hover:text-accent transition-colors">
          {product.name}
        </h3>
        <p className="text-accent font-bold mt-2">
          {product.discount_price
            ? `$${product.discount_price.toFixed(2)}`
            : `$${product.price.toFixed(2)}`}
        </p>
      </div>
    </Link>
  );
}

function ServiceCard({ service }: { service: Service }) {
  return (
    <Link to={`/services`} className="block bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="aspect-video bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
        <Wrench size={32} className="text-gray-400" />
      </div>
      <h3 className="font-semibold text-primary-900">{service.name}</h3>
      <p className="text-sm text-gray-500 mt-1">{service.duration_minutes} min</p>
      <p className="text-accent font-bold mt-2">From ${service.price.toFixed(2)}</p>
      <button className="mt-4 w-full py-2 bg-primary-900 text-white rounded-lg text-sm font-medium hover:bg-primary-800 transition-colors">
        Book Now
      </button>
    </Link>
  );
}

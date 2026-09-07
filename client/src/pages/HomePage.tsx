import { Link } from 'react-router-dom';
import { ArrowRight, Car, Wrench, ShieldCheck, Clock, CalendarCheck, Gauge, Heart, Users, Award } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getServices } from '../lib/api';
import type { Service } from '../types';

export default function HomePage() {
  const { data: services } = useQuery({
    queryKey: ['featured-services'],
    queryFn: () => getServices().then((r) => (r.data || []).slice(0, 4)),
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
                  to="/services"
                  className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Book a Service <ArrowRight size={18} />
                </Link>
              </div>
            </div>
            <div className="hidden md:flex justify-center">
              <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-primary-700 bg-black p-5 shadow-2xl shadow-black/30">
                <div className="absolute inset-x-0 top-0 h-1 bg-accent" />
                <div className="flex items-center gap-5">
                  <img
                    src="/logo.jpeg"
                    alt="Malhotra Automobiles Chandausi"
                    className="h-36 w-36 shrink-0 rounded-xl object-contain bg-black ring-1 ring-primary-700"
                  />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Since 1977</p>
                    <p className="mt-2 text-2xl font-bold text-white">Care for every mile.</p>
                    <p className="mt-2 text-sm leading-6 text-primary-300">Parts, servicing, and time slots managed in one place.</p>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3 border-t border-primary-700 pt-4">
                  <div className="flex items-center gap-2 text-sm text-primary-200"><CalendarCheck size={17} className="text-accent" /> Easy booking</div>
                  <div className="flex items-center gap-2 text-sm text-primary-200"><Gauge size={17} className="text-accent" /> Expert service</div>
                </div>
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

      {/* About Us Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-primary-900 mb-6">About Malhotra Automobiles</h2>
          <p className="text-gray-600 text-lg leading-relaxed mb-8">
            Malhotra Automobiles has been serving the Chandausi community with dedication and excellence.
            We specialize in providing high-quality automobile products and professional maintenance services.
            Our team of experienced technicians ensures that your vehicle receives the best care possible.
            With a commitment to customer satisfaction and transparent service, we have built lasting
            relationships with our clients over the years.
          </p>
          <div className="grid grid-cols-3 gap-8 mt-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="text-accent" size={28} />
              </div>
              <h3 className="font-semibold text-primary-900">Trusted Service</h3>
              <p className="text-sm text-gray-500 mt-1">Since 1977</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="text-accent" size={28} />
              </div>
              <h3 className="font-semibold text-primary-900">Expert Team</h3>
              <p className="text-sm text-gray-500 mt-1">Certified Technicians</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="text-accent" size={28} />
              </div>
              <h3 className="font-semibold text-primary-900">Quality Parts</h3>
              <p className="text-sm text-gray-500 mt-1">Genuine Products</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ServiceCard({ service }: { service: Service }) {
  return (
    <Link to={`/services/book/${service.slug}`} className="block bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="aspect-video bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
        <Wrench size={32} className="text-gray-400" />
      </div>
      <h3 className="font-semibold text-primary-900">{service.name}</h3>
      <p className="text-sm text-gray-500 mt-1">{service.duration_minutes} min</p>
      <p className="text-accent font-bold mt-2">From ₹{service.price.toFixed(2)}</p>
      <button className="mt-4 w-full py-2 bg-primary-900 text-white rounded-lg text-sm font-medium hover:bg-primary-800 transition-colors">
        Book Now
      </button>
    </Link>
  );
}

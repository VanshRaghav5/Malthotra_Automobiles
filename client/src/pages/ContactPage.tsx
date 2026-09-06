import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { getSettings } from '../lib/api';
import type { BusinessSettings } from '../types';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const { data: settings } = useQuery({
    queryKey: ['business-settings'],
    queryFn: () => getSettings().then((res) => res.data as BusinessSettings),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, this would post to an API endpoint
    setSubmitted(true);
    setForm({ name: '', email: '', message: '' });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold text-primary-900 mb-8">Contact Us</h1>

      <div className="grid md:grid-cols-2 gap-12">
        {/* Contact info */}
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold text-primary-900 mb-4">Get in Touch</h2>
            <p className="text-gray-600">Have a question or need help? Reach out to us.</p>
          </div>

          {[
            { icon: MapPin, label: 'Address', value: settings?.address || 'Malhotra Automobiles, Your City' },
            { icon: Phone, label: 'Phone', value: settings?.phone || '+91 XXXXX XXXXX' },
            { icon: Mail, label: 'Email', value: settings?.email || 'info@malhotraautomobiles.com' },
            { icon: Clock, label: 'Hours', value: `${settings?.weekday_hours || 'Mon-Sat: 9AM - 7PM'}\n${settings?.sunday_hours || 'Sunday: Closed'}` },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-4">
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon className="text-accent" size={20} />
              </div>
              <div>
                <p className="font-medium text-primary-900">{label}</p>
                <p className="text-gray-600 whitespace-pre-line">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Contact form */}
        <div className="bg-white border border-gray-200 rounded-xl p-8">
          {submitted ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-primary-900 mb-2">Message Sent!</h3>
              <p className="text-gray-500">We&apos;ll get back to you within 24 hours.</p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-6 text-accent hover:text-accent-hover font-medium"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={form.name}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                <textarea
                  name="message"
                  required
                  rows={5}
                  value={form.message}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="How can we help you?"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-accent hover:bg-accent-hover text-white rounded-lg font-medium transition-colors"
              >
                Send Message
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

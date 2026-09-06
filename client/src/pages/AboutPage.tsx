import { Wrench, Car, ShieldCheck, Clock } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold text-primary-900 mb-8">About Malhotra Automobiles</h1>

      <div className="prose prose-lg text-gray-600 space-y-6">
        <p>
          Malhotra Automobiles is your trusted local partner for all automobile needs.
          Whether you&apos;re looking for genuine spare parts, expert servicing, or convenient booking —
          we&apos;ve got you covered.
        </p>
        <p>
          With years of experience in the automobile industry, we pride ourselves on providing
          high-quality products and professional service at competitive prices. Our team of certified
          mechanics ensures your vehicle gets the best care possible.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
        {[
          { icon: ShieldCheck, label: 'Genuine Parts', desc: '100% authentic components' },
          { icon: Wrench, label: 'Expert Service', desc: 'Certified mechanics' },
          { icon: Clock, label: 'Quick Turnaround', desc: 'Efficient service delivery' },
          { icon: Car, label: 'All Makes', desc: 'Every vehicle welcome' },
        ].map(({ icon: Icon, label, desc }) => (
          <div key={label} className="text-center">
            <Icon className="mx-auto text-accent mb-3" size={32} />
            <h3 className="font-semibold text-primary-900">{label}</h3>
            <p className="text-sm text-gray-500 mt-1">{desc}</p>
          </div>
        ))}
      </div>

    </div>
  );
}

import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getService, getServiceAvailability, submitRequest } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { Calendar, Clock, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import type { Service, AvailabilitySlot } from '../types';

export default function ServiceBookingPage() {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated, user } = useAuthStore();
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleRegistration, setVehicleRegistration] = useState('');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [acceptedDisclaimer, setAcceptedDisclaimer] = useState(false);

  const { data: service, isLoading: loadingService } = useQuery({
    queryKey: ['service', slug],
    queryFn: () => getService(slug!).then((r) => r.data as Service),
    enabled: !!slug,
  });

  // Calculate date range: weekOffset weeks from today
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() + weekOffset * 7);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);

  const { data: slots, isLoading: loadingSlots } = useQuery({
    queryKey: ['service-availability', slug, startDate.toISOString().split('T')[0]],
    queryFn: () =>
      getServiceAvailability(
        slug!,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      ).then((r) => r.data as AvailabilitySlot[]),
    enabled: !!slug && !!service,
  });

  if (loadingService) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse bg-gray-100 h-96 rounded-xl" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-primary-900">Service not found</h1>
        <Link to="/services" className="text-accent mt-4 inline-block">Back to Services</Link>
      </div>
    );
  }

  // Group slots by date
  const slotsByDate: Record<string, AvailabilitySlot[]> = {};
  slots?.forEach((slot) => {
    if (!slotsByDate[slot.date]) slotsByDate[slot.date] = [];
    slotsByDate[slot.date].push(slot);
  });

  const dates = Object.keys(slotsByDate).sort();

  const slotStatusLabel = (slot: AvailabilitySlot) => {
    if (slot.status === 'available') return `${slot.capacity} slot${slot.capacity === 1 ? '' : 's'} available`;
    if (slot.status === 'booked') return 'Booked';
    if (slot.status === 'held') return 'Temporarily held';
    if (slot.status === 'blocked') return 'Unavailable';
    return slot.status;
  };

  const handleNextWeek = () => setWeekOffset((w) => w + 1);
  const handlePrevWeek = () => setWeekOffset((w) => Math.max(0, w - 1));

  const handleBook = async () => {
    if (!selectedSlot || !service) return;
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitRequest({
        customer_name: user?.name || 'Customer',
        customer_phone: customerPhone || user?.phone || 'N/A',
        customer_email: user?.email || '',
        vehicle_make: vehicleMake.trim() || 'General',
        vehicle_model: vehicleModel.trim() || 'Vehicle',
        vehicle_registration: vehicleRegistration.trim() || undefined,
        notes,
        services: [{ service_id: service.id, slot_id: selectedSlot }],
      });
      window.location.href = `/request/${res.data.request_number}`;
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to book service');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/services" className="inline-flex items-center gap-1 text-gray-500 hover:text-primary-900 text-sm mb-6">
        <ChevronLeft size={16} /> Back to Services
      </Link>

      <div className="bg-white rounded-xl border border-gray-200 p-8 mb-8">
        <h1 className="text-3xl font-bold text-primary-900">{service.name}</h1>
        {service.description && (
          <p className="text-gray-600 mt-3">{service.description}</p>
        )}
        <div className="flex items-center gap-6 mt-6">
          <div className="flex items-center gap-2 text-gray-600">
            <Clock size={18} />
            <span>{service.duration_minutes} minutes</span>
          </div>
          <p className="text-2xl font-bold text-accent">₹{service.price.toFixed(2)}</p>
        </div>
      </div>

      {/* Week navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevWeek}
          disabled={weekOffset === 0}
          className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-40"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="font-medium text-primary-900">
          {formatDate(startDate.toISOString().split('T')[0])} — {formatDate(endDate.toISOString().split('T')[0])}
        </span>
        <button
          onClick={handleNextWeek}
          className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Slots */}
      {loadingSlots ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-100 h-20 rounded-xl" />
          ))}
        </div>
      ) : dates.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-12 text-center">
          <Calendar size={40} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No slots available for this week. Try a different week.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {dates.map((date) => (
            <div key={date}>
              <h3 className="font-semibold text-primary-900 mb-3">{formatDate(date)}</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {slotsByDate[date].map((slot) => (
                  <button
                    key={slot.id}
                    onClick={() => setSelectedSlot(slot.id)}
                    disabled={slot.status !== 'available'}
                    aria-label={`${formatDate(date)} at ${slot.start_time}: ${slotStatusLabel(slot)}`}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      selectedSlot === slot.id
                        ? 'border-accent bg-accent/10'
                        : slot.status === 'available'
                        ? 'border-accent/30 bg-white hover:border-accent hover:bg-accent/5 cursor-pointer'
                        : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <p className={`font-medium ${slot.status === 'available' ? 'text-primary-900' : 'text-gray-500'}`}>{slot.start_time}</p>
                    <p className="text-xs mt-1">{slotStatusLabel(slot)}</p>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-gray-500">
        <span className="inline-flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-accent" /> Available</span>
        <span className="inline-flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-gray-300" /> Booked or unavailable</span>
      </div>

      {/* Vehicle & Notes & Submit */}
      <div className="mt-8 bg-gray-50 rounded-xl p-6">
        <h3 className="font-semibold text-primary-900 mb-4">Vehicle Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Make *</label>
            <input
              type="text"
              value={vehicleMake}
              onChange={(e) => setVehicleMake(e.target.value)}
              placeholder="e.g. Maruti Suzuki, Hyundai"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Model *</label>
            <input
              type="text"
              value={vehicleModel}
              onChange={(e) => setVehicleModel(e.target.value)}
              placeholder="e.g. Swift, i20"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number (optional)</label>
            <input
              type="text"
              value={vehicleRegistration}
              onChange={(e) => setVehicleRegistration(e.target.value)}
              placeholder="e.g. DL 01 AB 1234"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Your contact number"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>

        <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
          placeholder="Any special requirements or notes..."
        />
        <button
          onClick={() => !selectedSlot || submitting ? null : setShowDisclaimer(true)}
          disabled={!selectedSlot || submitting}
          className="mt-4 w-full py-3 bg-accent hover:bg-accent-hover disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
        >
          {submitting ? 'Booking...' : !selectedSlot ? 'Select a time slot first' : 'Book Service'}
        </button>
        {!isAuthenticated && (
          <p className="text-sm text-gray-500 mt-2 text-center">
            <Link to="/login" className="text-accent hover:underline">Sign in</Link> to book a service
          </p>
        )}
      </div>

      {/* Disclaimer Modal */}
      {showDisclaimer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowDisclaimer(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertTriangle size={24} className="text-yellow-600" />
              </div>
              <h2 className="text-xl font-bold text-primary-900">Important Notice</h2>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-yellow-800 leading-relaxed">
                <strong>Please note:</strong> If you do not arrive at your scheduled time, your appointment will be
                automatically cancelled and the slot released to other customers. We cannot be held responsible
                for any inconvenience caused by no-shows. Please ensure you can attend at the booked time.
              </p>
            </div>
            <label className="flex items-start gap-3 mb-6 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedDisclaimer}
                onChange={(e) => setAcceptedDisclaimer(e.target.checked)}
                className="mt-1 w-5 h-5 rounded border-gray-300 text-accent focus:ring-accent"
              />
              <span className="text-sm text-gray-700">
                I understand and agree to the above policy
              </span>
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDisclaimer(false);
                  setAcceptedDisclaimer(false);
                }}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (acceptedDisclaimer) {
                    setShowDisclaimer(false);
                    setAcceptedDisclaimer(false);
                    handleBook();
                  }
                }}
                disabled={!acceptedDisclaimer}
                className="flex-1 py-3 bg-accent hover:bg-accent-hover disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
              >
                Confirm & Book
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

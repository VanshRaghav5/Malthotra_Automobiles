import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getServices, createService, updateService, createSlot, deleteSlot, deleteService, uploadServiceImage } from '../../lib/api';
import type { Service } from '../../types';
import { Plus, Calendar, Clock, Trash2, X, Check, Camera, Upload } from 'lucide-react';

const SERVICE_IMAGE_URL = 'https://rlmmyueiqqegelkvxjxa.supabase.co/storage/v1/object/public/product-images';

export default function AdminServices() {
  const queryClient = useQueryClient();
  const [showSlots, setShowSlots] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', duration_minutes: '', price: '' });
  const [saving, setSaving] = useState(false);
  const [slotForm, setSlotForm] = useState({ date: '', start_time: '', end_time: '', capacity: '1' });
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);

  const { data: services, isLoading } = useQuery({
    queryKey: ['admin-services'],
    queryFn: () => getServices().then((r) => r.data || []),
  });

  const handleAddSlot = async (serviceId: string) => {
    if (!slotForm.date || !slotForm.start_time || !slotForm.end_time) return;
    try {
      await createSlot(serviceId, {
        ...slotForm,
        capacity: parseInt(slotForm.capacity),
      });
      setSlotForm({ date: '', start_time: '', end_time: '', capacity: '1' });
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
      queryClient.invalidateQueries({ queryKey: ['all-services'] });
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create slot');
    }
  };

  const handleDeleteSlot = async (serviceId: string, slotId: string) => {
    try {
      await deleteSlot(serviceId, slotId);
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
      queryClient.invalidateQueries({ queryKey: ['all-services'] });
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete slot');
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm('Delete this service? All associated slots will also be deleted.')) return;
    try {
      await deleteService(id);
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
      queryClient.invalidateQueries({ queryKey: ['all-services'] });
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete service');
    }
  };

  const handleImageUpload = async (serviceId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Compress image before upload
    try {
      const compressed = await compressImage(file, 800, 0.8);
      setUploadingImage(serviceId);
      await uploadServiceImage(serviceId, compressed);
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
      queryClient.invalidateQueries({ queryKey: ['all-services'] });
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to upload image');
    } finally {
      setUploadingImage(null);
      e.target.value = '';
    }
  };

  const compressImage = (file: File, maxWidth: number, quality: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const resetForm = () => {
    setForm({ name: '', description: '', duration_minutes: '', price: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (service: Service) => {
    setForm({ name: service.name, description: service.description || '', duration_minutes: String(service.duration_minutes), price: String(service.price) });
    setEditingId(service.id);
    setShowForm(true);
  };

  const handleServiceSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description || undefined,
        duration_minutes: Number(form.duration_minutes),
        price: Number(form.price),
      };
      if (editingId) await updateService(editingId, payload);
      else await createService(payload);
      await queryClient.invalidateQueries({ queryKey: ['admin-services'] });
      queryClient.invalidateQueries({ queryKey: ['all-services'] });
      resetForm();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save service');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-primary-900">Services</h1>
        <button onClick={() => { setEditingId(null); setForm({ name: '', description: '', duration_minutes: '', price: '' }); setShowForm(true); }} className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-lg font-medium">
          <Plus size={18} /> Add Service
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleServiceSubmit} className="bg-white border border-gray-200 rounded-xl p-6 mb-8 space-y-4">
          <div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-primary-900">{editingId ? 'Edit Service' : 'New Service'}</h2><button type="button" onClick={resetForm} className="text-gray-400 hover:text-gray-600">Close</button></div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes) *</label><input required min="1" type="number" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Price (₹) *</label><input required min="0.01" step="0.01" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" /></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" /></div>
          <div className="flex gap-3"><button type="submit" disabled={saving} className="inline-flex items-center gap-2 bg-accent text-white px-5 py-2 rounded-lg disabled:bg-gray-400"><Plus size={16} />{saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Service'}</button><button type="button" onClick={resetForm} className="border border-gray-300 px-5 py-2 rounded-lg hover:bg-gray-50">Cancel</button></div>
        </form>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-white h-24 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {services?.map((service: Service) => (
            <div key={service.id} className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-start gap-4">
                {/* Service Image */}
                <div className="w-32 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center relative group">
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
                  <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(service.id, e)}
                      disabled={uploadingImage === service.id}
                    />
                    {uploadingImage === service.id ? (
                      <span className="text-white text-xs">Uploading...</span>
                    ) : (
                      <Camera size={20} className="text-white" />
                    )}
                  </label>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-primary-900">{service.name}</h3>
                      {service.description && (
                        <p className="text-gray-500 text-sm mt-1 line-clamp-2">{service.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 ml-4">
                      <button onClick={() => startEdit(service)} className="p-1.5 text-gray-400 hover:text-accent rounded hover:bg-gray-100" title="Edit service">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button onClick={() => handleDeleteService(service.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-gray-100" title="Delete service">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1"><Clock size={14} /> {service.duration_minutes} min</span>
                    <span className="font-medium text-accent">₹{service.price.toFixed(2)}</span>
                    <span>{service.availability_slots?.filter((slot) => slot.status === 'available').length || 0} available slots</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${service.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {service.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setShowSlots(showSlots === service.id ? null : service.id)}
                  className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary-900"
                >
                  <Calendar size={14} /> Manage Slots
                </button>

                {showSlots === service.id && (
                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
                        <input type="date" value={slotForm.date} onChange={(e) => setSlotForm({ ...slotForm, date: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Start Time</label>
                        <input type="time" value={slotForm.start_time} onChange={(e) => setSlotForm({ ...slotForm, start_time: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">End Time</label>
                        <input type="time" value={slotForm.end_time} onChange={(e) => setSlotForm({ ...slotForm, end_time: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Capacity</label>
                        <input type="number" min="1" value={slotForm.capacity} onChange={(e) => setSlotForm({ ...slotForm, capacity: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddSlot(service.id)}
                      disabled={!slotForm.date || !slotForm.start_time || !slotForm.end_time}
                      className="flex items-center gap-2 text-sm bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent-hover disabled:bg-gray-400"
                    >
                      <Plus size={14} /> Add Slot
                    </button>

                    {service.availability_slots && service.availability_slots.length > 0 && (
                      <div className="pt-2 border-t border-gray-100">
                        <p className="text-xs font-medium text-gray-500 mb-2">Existing Slots:</p>
                        <div className="flex flex-wrap gap-2">
                          {service.availability_slots.map((slot) => (
                            <span key={slot.id} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs ${slot.status === 'available' ? 'bg-accent/10 text-primary-900' : 'bg-gray-200 text-gray-500'}`}>
                              {slot.date} {slot.start_time} · {slot.status}
                              <button
                                onClick={() => handleDeleteSlot(service.id, slot.id)}
                                disabled={slot.status !== 'available'}
                                className="text-red-500 hover:text-red-700 font-bold ml-1"
                                title="Delete slot"
                              >
                                &times;
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAdminSettings, updateSettings } from '../../lib/api';
import type { BusinessSettings } from '../../types';
import { Check, Save } from 'lucide-react';

const emptySettings: BusinessSettings = {
  business_name: '', address: '', phone: '', email: '', weekday_hours: '', sunday_hours: '',
  weekday_start: '09:00', weekday_end: '19:00', sunday_start: '', sunday_end: '', sunday_closed: 'true', owner_email: '',
};

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<BusinessSettings>(emptySettings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ['business-settings'],
    queryFn: () => getAdminSettings().then((res) => res.data as BusinessSettings),
  });

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setSaved(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await updateSettings(form);
      setForm(response.data);
      await queryClient.invalidateQueries({ queryKey: ['business-settings'] });
      setSaved(true);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <div className="animate-pulse bg-white rounded-xl h-96" />;

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-primary-900 mb-2">Business Settings</h1>
      <p className="text-gray-500 mb-8">These details update the public Contact page, footer, and booking notifications.</p>
      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
          <input name="business_name" value={form.business_name} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg px-4 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <textarea name="address" value={form.address} onChange={handleChange} required rows={2} className="w-full border border-gray-300 rounded-lg px-4 py-2" />
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Public Phone</label><input name="phone" value={form.phone} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg px-4 py-2" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Public Email</label><input type="email" name="email" value={form.email} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg px-4 py-2" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Owner Notification Email</label><input type="email" name="owner_email" value={form.owner_email} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg px-4 py-2" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Weekday Hours</label><input name="weekday_hours" value={form.weekday_hours} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg px-4 py-2" /></div>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-primary-900 mb-3">Automatic Service Slots</h2>
          <p className="text-sm text-gray-500 mb-4">New and future slots are generated in one-hour blocks for the next 30 days using this schedule.</p>
          <div className="grid sm:grid-cols-2 gap-5">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Weekday opening</label><input type="time" name="weekday_start" value={form.weekday_start} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg px-4 py-2" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Weekday closing</label><input type="time" name="weekday_end" value={form.weekday_end} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg px-4 py-2" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Sunday opening</label><input type="time" name="sunday_start" value={form.sunday_start} onChange={handleChange} disabled={form.sunday_closed === 'true'} className="w-full border border-gray-300 rounded-lg px-4 py-2 disabled:bg-gray-100" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Sunday closing</label><input type="time" name="sunday_end" value={form.sunday_end} onChange={handleChange} disabled={form.sunday_closed === 'true'} className="w-full border border-gray-300 rounded-lg px-4 py-2 disabled:bg-gray-100" /></div>
          </div>
          <label className="mt-4 inline-flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={form.sunday_closed === 'true'} onChange={(event) => setForm((current) => ({ ...current, sunday_closed: event.target.checked ? 'true' : 'false' }))} className="h-4 w-4 accent-accent" /> Closed on Sunday</label>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Public Sunday Hours</label><input name="sunday_hours" value={form.sunday_hours} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg px-4 py-2" /></div>
        <button type="submit" disabled={saving} className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover disabled:bg-gray-400 text-white px-5 py-2.5 rounded-lg font-medium">
          {saved ? <Check size={18} /> : <Save size={18} />} {saving ? 'Saving...' : saved ? 'Saved' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}
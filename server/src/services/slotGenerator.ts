import type { SupabaseClient } from '@supabase/supabase-js';

const defaultSchedule = {
  weekday_start: '09:00',
  weekday_end: '19:00',
  sunday_start: '',
  sunday_end: '',
  sunday_closed: 'true',
};

function parseMinutes(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }
  return hours * 60 + minutes;
}

async function readSchedule(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('business_settings')
    .select('key, value')
    .in('key', Object.keys(defaultSchedule));
  if (error) throw error;

  const schedule = { ...defaultSchedule };
  for (const row of data || []) {
    if (row.key in schedule && typeof row.value === 'string') {
      schedule[row.key as keyof typeof schedule] = row.value;
    }
  }
  return schedule;
}

function dateString(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function generateAutomaticSlots(supabase: SupabaseClient, serviceIds?: string[]) {
  const schedule = await readSchedule(supabase);
  const { data: services, error: servicesError } = serviceIds
    ? { data: serviceIds.map((id) => ({ id })), error: null }
    : await supabase.from('services').select('id').eq('active', true);
  if (servicesError) throw servicesError;
  if (!services?.length) return 0;

  const ids = services.map((service) => service.id);
  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 29);
  const firstDate = dateString(today);
  const lastDate = dateString(endDate);

  const { error: deleteError } = await supabase
    .from('availability_slots')
    .delete()
    .in('service_id', ids)
    .eq('status', 'available')
    .gte('date', firstDate)
    .lte('date', lastDate);
  if (deleteError) throw deleteError;

  const rows: Array<Record<string, string | number>> = [];
  for (let offset = 0; offset < 30; offset += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() + offset);
    const isSunday = date.getDay() === 0;
    const start = isSunday ? schedule.sunday_start : schedule.weekday_start;
    const end = isSunday ? schedule.sunday_end : schedule.weekday_end;
    if (isSunday && schedule.sunday_closed === 'true') continue;

    const startMinutes = parseMinutes(start);
    const endMinutes = parseMinutes(end);
    if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) continue;

    for (let minutes = startMinutes; minutes + 60 <= endMinutes; minutes += 60) {
      const startHour = String(Math.floor(minutes / 60)).padStart(2, '0');
      const startMinute = String(minutes % 60).padStart(2, '0');
      const endTotal = minutes + 60;
      const endHour = String(Math.floor(endTotal / 60)).padStart(2, '0');
      const endMinute = String(endTotal % 60).padStart(2, '0');
      for (const serviceId of ids) {
        rows.push({
          service_id: serviceId,
          date: dateString(date),
          start_time: `${startHour}:${startMinute}:00`,
          end_time: `${endHour}:${endMinute}:00`,
          status: 'available',
          capacity: 1,
        });
      }
    }
  }

  if (!rows.length) return 0;
  const { error: insertError } = await supabase.from('availability_slots').insert(rows);
  if (insertError) throw insertError;
  return rows.length;
}

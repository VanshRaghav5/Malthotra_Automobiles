import { Router, Response } from 'express';
import { z } from 'zod';
import { getSupabase } from '../lib/supabase';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { generateAutomaticSlots } from '../services/slotGenerator';

const settingsSchema = z.object({
  business_name: z.string().min(1),
  address: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email(),
  weekday_hours: z.string().min(1),
  sunday_hours: z.string().min(1),
  weekday_start: z.string().regex(/^\d{2}:\d{2}$/),
  weekday_end: z.string().regex(/^\d{2}:\d{2}$/),
  sunday_start: z.string().regex(/^\d{2}:\d{2}$/).or(z.literal('')),
  sunday_end: z.string().regex(/^\d{2}:\d{2}$/).or(z.literal('')),
  sunday_closed: z.enum(['true', 'false']),
  owner_email: z.string().email(),
});

const defaultSettings = {
  business_name: 'Malhotra Automobiles',
  address: 'Malhotra Automobiles, Your City',
  phone: '+91 XXXXX XXXXX',
  email: 'info@malhotraautomobiles.com',
  weekday_hours: 'Mon-Sat: 9AM - 7PM',
  sunday_hours: 'Sunday: Closed',
  weekday_start: '09:00',
  weekday_end: '19:00',
  sunday_start: '',
  sunday_end: '',
  sunday_closed: 'true',
  owner_email: 'info@malhotraautomobiles.com',
};

const getSettings = async (supabase: ReturnType<typeof getSupabase>) => {
  const { data, error } = await supabase
    .from('business_settings')
    .select('key, value');
  if (error) throw error;

  const settings = { ...defaultSettings };
  for (const row of data || []) {
    if (row.key in settings && typeof row.value === 'string') {
      settings[row.key as keyof typeof settings] = row.value;
    }
  }
  return settings;
};

const settingsRouter = () => {
  const router = Router();
  const supabase = getSupabase();

  router.get('/', async (_req, res: Response) => {
    try {
      const settings = await getSettings(supabase);
      const publicSettings = {
        business_name: settings.business_name,
        address: settings.address,
        phone: settings.phone,
        email: settings.email,
        weekday_hours: settings.weekday_hours,
        sunday_hours: settings.sunday_hours,
        weekday_start: settings.weekday_start,
        weekday_end: settings.weekday_end,
        sunday_start: settings.sunday_start,
        sunday_end: settings.sunday_end,
        sunday_closed: settings.sunday_closed,
      };
      res.json(publicSettings);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/admin', authMiddleware, async (req: AuthRequest, res: Response) => {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    try {
      res.json(await getSettings(supabase));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.put('/', authMiddleware, async (req: AuthRequest, res: Response) => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const parsed = settingsSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });

    const rows = Object.entries(parsed.data).map(([key, value]) => ({
      key,
      value,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await supabase.from('business_settings').upsert(rows);
    if (error) return res.status(500).json({ error: error.message });

    try {
      await generateAutomaticSlots(supabase);
    } catch (slotError) {
      console.error('Failed to regenerate automatic service slots:', slotError);
      return res.status(500).json({ error: 'Settings saved, but automatic slots could not be regenerated' });
    }

    res.json(parsed.data);
  });

  return router;
};

export default settingsRouter;
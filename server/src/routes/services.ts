import { Router, Response } from 'express';
import { z } from 'zod';
import { getSupabase } from '../lib/supabase';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { generateAutomaticSlots } from '../services/slotGenerator';

const serviceSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).optional(),
  description: z.string().optional(),
  duration_minutes: z.number().int().positive(),
  price: z.number().positive(),
  active: z.boolean().optional(),
});

const slotSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start_time: z.string().regex(/^(\d{2}:\d{2})$/),
  end_time: z.string().regex(/^(\d{2}:\d{2})$/),
  capacity: z.number().int().positive().optional(),
  notes: z.string().optional(),
});

const servicesRouter = () => {
  const router = Router();
  const supabase = getSupabase();

  // GET /api/v1/services - List active services
  router.get('/', async (_req: AuthRequest, res: Response) => {
    const { data, error } = await supabase
      .from('services')
      .select('*, availability_slots(*)')
      .eq('active', true)
      .order('name');

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  // GET /api/v1/services/:slug - Get single service with slots
  router.get('/:slug', async (req: AuthRequest, res: Response) => {
    const { data: service, error } = await supabase
      .from('services')
      .select('*, availability_slots(*)')
      .eq('slug', req.params.slug)
      .eq('active', true)
      .single();

    if (error || !service) return res.status(404).json({ error: 'Service not found' });
    res.json(service);
  });

  // GET /api/v1/services/:slug/availability - Get available slots for a date range
  router.get('/:slug/availability', async (req: AuthRequest, res: Response) => {
    const { startDate, endDate } = req.query;

    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('id')
      .eq('slug', req.params.slug)
      .single();

    if (serviceError || !service) return res.status(404).json({ error: 'Service not found' });

    let query = supabase
      .from('availability_slots')
      .select('*')
      .eq('service_id', service.id);

    if (startDate) query = query.gte('date', startDate as string);
    if (endDate) query = query.lte('date', endDate as string);

    const { data, error } = await query.order('date').order('start_time');

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  // Admin: POST /api/v1/services - Create service
  router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const parsed = serviceSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });

    const baseSlug = (parsed.data.slug || parsed.data.name)
      .toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    let slug = baseSlug || `service-${Date.now()}`;
    const { data: existing } = await supabase.from('services').select('id').eq('slug', slug).maybeSingle();
    if (existing) slug = `${slug}-${Date.now()}`;

    const { data, error } = await supabase
      .from('services')
      .insert({ ...parsed.data, slug, active: true })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    try {
      await generateAutomaticSlots(supabase, [data.id]);
    } catch (slotError) {
      console.error('Failed to create automatic service slots:', slotError);
      return res.status(500).json({ error: 'Service created, but automatic slots could not be generated' });
    }
    res.status(201).json(data);
  });

  // Admin: PATCH /api/v1/services/:id - Update service
  router.patch('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const parsed = serviceSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });

    const { data, error } = await supabase
      .from('services')
      .update(parsed.data)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  // Admin: POST /api/v1/services/:serviceId/slots - Create slot
  router.post('/:serviceId/slots', authMiddleware, async (req: AuthRequest, res: Response) => {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const parsed = slotSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });

    const { data, error } = await supabase
      .from('availability_slots')
      .insert({ ...parsed.data, service_id: req.params.serviceId })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(data);
  });

  // Admin: DELETE /api/v1/services/:serviceId/slots/:slotId - Delete slot
  router.delete('/:serviceId/slots/:slotId', authMiddleware, async (req: AuthRequest, res: Response) => {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { error } = await supabase
      .from('availability_slots')
      .delete()
      .eq('id', req.params.slotId)
      .eq('service_id', req.params.serviceId);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  // Admin: DELETE /api/v1/services/:id - Delete service
  router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', req.params.id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  return router;
};

export default servicesRouter;

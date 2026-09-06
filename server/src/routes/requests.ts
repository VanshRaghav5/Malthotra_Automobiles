import { Router, Response } from 'express';
import { z } from 'zod';
import { getSupabase } from '../lib/supabase';
import { AuthRequest } from '../middleware/auth';
import { sendRequestConfirmation } from '../services/email';

const submitRequestSchema = z.object({
  customer_name: z.string().min(1),
  customer_phone: z.string().min(8),
  customer_email: z.string().email(),
  vehicle_make: z.string().min(1),
  vehicle_model: z.string().min(1),
  vehicle_registration: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    product_id: z.string().uuid(),
    quantity: z.number().int().positive(),
  })).optional(),
  services: z.array(z.object({
    service_id: z.string().uuid(),
    slot_id: z.string().uuid(),
  })).optional(),
});

const requestsRouter = () => {
  const router = Router();
  const supabase = getSupabase();

  // POST /api/v1/requests - Submit a new request
  router.post('/', async (req: AuthRequest, res: Response) => {
    const parsed = submitRequestSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });

    const { customer_name, customer_phone, customer_email, vehicle_make, vehicle_model, vehicle_registration, notes, items, services } = parsed.data;

    // Find or create customer profile
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', customer_email)
      .single();

    if (profileError || !profile) {
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          auth_user_id: null, // Guest request
          role: 'customer',
          name: customer_name,
          phone: customer_phone,
          email: customer_email,
        })
        .select('id')
        .single();

      if (createError || !newProfile) {
        return res.status(500).json({ error: 'Failed to create customer profile' });
      }
      profile = newProfile;
    }

    // Create or find vehicle
    let vehicleId: string | null = null;
    if (vehicle_make && vehicle_model) {
      let { data: vehicle } = await supabase
        .from('vehicles')
        .select('id')
        .eq('customer_id', profile.id)
        .eq('make', vehicle_make)
        .eq('model', vehicle_model)
        .single();

      if (!vehicle) {
        const { data: newVehicle } = await supabase
          .from('vehicles')
          .insert({ customer_id: profile.id, make: vehicle_make, model: vehicle_model, registration_number: vehicle_registration })
          .select('id')
          .single();
        vehicle = newVehicle;
      }
      vehicleId = vehicle?.id || null;
    }

    // Calculate estimated total
    let estimatedTotal = 0;
    if (items?.length) {
      const productIds = items.map(i => i.product_id);
      const { data: products } = await supabase.from('products').select('id, price').in('id', productIds);
      if (products) {
        for (const item of items) {
          const product = products.find(p => p.id === item.product_id);
          if (product) estimatedTotal += product.price * item.quantity;
        }
      }
    }
    if (services?.length) {
      const serviceIds = services.map(s => s.service_id);
      const slotIds = services.map(s => s.slot_id);
      const { data: svcData } = await supabase.from('services').select('id, price').in('id', serviceIds);
      if (svcData) {
        for (const svc of services) {
          const service = svcData.find(s => s.id === svc.service_id);
          if (service) estimatedTotal += service.price;
        }
      }
    }

    // Begin transaction via Supabase
    const { data: request, error: requestError } = await supabase
      .from('requests')
      .insert({
        customer_id: profile.id,
        vehicle_id: vehicleId,
        status: 'submitted',
        notes,
        estimated_total: estimatedTotal,
      })
      .select()
      .single();

    if (requestError || !request) {
      return res.status(500).json({ error: 'Failed to create request' });
    }

    // Add items
    if (items?.length) {
      const itemData = items.map(i => ({
        request_id: request.id,
        product_id: i.product_id,
        quantity: i.quantity,
      }));
      await supabase.from('request_items').insert(itemData);
    }

    // Add services with slot holding
    if (services?.length) {
      const serviceData = services.map(s => ({
        request_id: request.id,
        service_id: s.service_id,
        slot_id: s.slot_id,
      }));
      await supabase.from('request_services').insert(serviceData);

      // Hold the slots
      const slotIdsToHold = services.map(s => s.slot_id);
      await supabase
        .from('availability_slots')
        .update({ status: 'held' })
        .in('id', slotIdsToHold);
    }

    // Send confirmation emails
    try {
      await sendRequestConfirmation(customer_email, request, {
        customerName: customer_name,
        vehicleMake: vehicle_make,
        vehicleModel: vehicle_model,
      });
    } catch (e) {
      console.error('Email send failed:', e);
    }

    res.status(201).json(request);
  });

  // GET /api/v1/requests/:number - Get request by number
  router.get('/:number', async (req: AuthRequest, res: Response) => {
    const { data, error } = await supabase
      .from('requests')
      .select('*, request_items(*, products(*)), request_services(*, services(*), availability_slots(*))')
      .eq('request_number', req.params.number)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Request not found' });
    res.json(data);
  });

  return router;
};

export default requestsRouter;

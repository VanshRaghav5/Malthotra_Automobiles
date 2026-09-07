import { Router, Response } from 'express';
import { z } from 'zod';
import { getSupabase } from '../lib/supabase';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { sendOwnerNotification, sendRequestConfirmation } from '../services/email';
import { config } from '../config';

const submitRequestSchema = z.object({
  customer_name: z.string().min(1, 'Name is required'),
  customer_phone: z.string().optional().default(''),
  customer_email: z.string().email('Valid email is required'),
  vehicle_make: z.string().optional().default(''),
  vehicle_model: z.string().optional().default(''),
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

  // GET /api/v1/requests/my-requests - Get requests for current customer (MUST be before /:number)
  router.get('/my-requests', authMiddleware, async (req: AuthRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { data, error } = await supabase
      .from('requests')
      .select('*, request_items(*, products(*)), request_services(*, services(*), availability_slots(*))')
      .eq('customer_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  // POST /api/v1/requests - Submit a new request
  router.post('/', async (req: AuthRequest, res: Response) => {
    const parsed = submitRequestSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });

    const {
      customer_name,
      customer_phone,
      customer_email,
      vehicle_make,
      vehicle_model,
      vehicle_registration,
      notes,
      items,
      services,
    } = parsed.data;

    // Reject product items if products are disabled
    if (config.PRODUCTS_ENABLED === false && items?.length) {
      return res.status(400).json({ error: 'Product requests are currently unavailable' });
    }

    // Find or create customer profile
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', customer_email)
      .maybeSingle();

    if (profileError || !profile) {
      // Ensure auth_user_id NOT NULL constraint is satisfied
      const { data: existingUsers, error: listUsersError } = await supabase.auth.admin.listUsers();
      let authUserId = existingUsers?.users?.find(
        user => user.email?.toLowerCase() === customer_email.toLowerCase()
      )?.id || null;

      if (!authUserId && !listUsersError) {
        const { data: authUser, error: createAuthError } = await supabase.auth.admin.createUser({
          email: customer_email,
          email_confirm: true,
          user_metadata: { name: customer_name, is_guest: true },
        });
        authUserId = authUser?.user?.id || null;
        if (createAuthError) {
          console.warn('Could not create auth user for guest:', createAuthError.message);
        }
      }

      if (!authUserId) {
        return res.status(502).json({ error: 'Unable to create customer profile' });
      }

      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          auth_user_id: authUserId,
          role: 'customer',
          name: customer_name,
          phone: customer_phone || null,
          email: customer_email,
        })
        .select('id')
        .single();

      if (createError || !newProfile) {
        console.error('Failed to create customer profile:', createError);
        return res.status(500).json({ error: 'Failed to create customer profile' });
      }
      profile = newProfile;
    }

    // Create or find vehicle if provided
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
          .insert({
            customer_id: profile.id,
            make: vehicle_make,
            model: vehicle_model,
            registration_number: vehicle_registration || null,
          })
          .select('id')
          .single();
        vehicle = newVehicle;
      }
      vehicleId = vehicle?.id || null;
    }

    // Calculate estimated total and cache product / service data
    let estimatedTotal = 0;
    let productsList: { id: string; price: number }[] = [];
    let servicesList: { id: string; price: number; duration_minutes: number }[] = [];

    if (items?.length) {
      const productIds = items.map(i => i.product_id);
      const { data: products } = await supabase.from('products').select('id, price').in('id', productIds);
      if (products) {
        productsList = products;
        for (const item of items) {
          const product = products.find(p => p.id === item.product_id);
          if (product) estimatedTotal += product.price * item.quantity;
        }
      }
    }

    if (services?.length) {
      const serviceIds = services.map(s => s.service_id);
      const { data: svcData } = await supabase.from('services').select('id, price, duration_minutes').in('id', serviceIds);
      if (svcData) {
        servicesList = svcData;
        for (const svc of services) {
          const service = svcData.find(s => s.id === svc.service_id);
          if (service) estimatedTotal += service.price;
        }
      }
    }

    // Claim requested slots before creating the request. The conditional update
    // makes a slot unavailable to a second booking attempt.
    const claimedSlotIds: string[] = [];
    if (services?.length) {
      for (const service of services) {
        const { data: claimedSlot, error: claimError } = await supabase
          .from('availability_slots')
          .update({ status: 'booked', capacity: 0, updated_at: new Date().toISOString() })
          .eq('id', service.slot_id)
          .eq('service_id', service.service_id)
          .eq('status', 'available')
          .gt('capacity', 0)
          .select('id')
          .maybeSingle();

        if (claimError || !claimedSlot) {
          if (claimedSlotIds.length) {
            await supabase
              .from('availability_slots')
              .update({ status: 'available', capacity: 1 })
              .in('id', claimedSlotIds);
          }
          return res.status(409).json({ error: 'One or more selected time slots are no longer available.' });
        }
        claimedSlotIds.push(claimedSlot.id);
      }
    }

    // Create request
    const { data: request, error: requestError } = await supabase
      .from('requests')
      .insert({
        customer_id: profile.id,
        vehicle_id: vehicleId,
        status: 'submitted',
        notes: notes || null,
        estimated_total: estimatedTotal,
      })
      .select()
      .single();

    if (requestError || !request) {
      console.error('Failed to create request:', requestError);
      if (claimedSlotIds.length) {
        await supabase
          .from('availability_slots')
          .update({ status: 'available', capacity: 1 })
          .in('id', claimedSlotIds);
      }
      return res.status(500).json({ error: 'Failed to create request' });
    }

    // Add items with unit_price_snapshot
    if (items?.length) {
      const itemData = items.map(i => {
        const prod = productsList.find(p => p.id === i.product_id);
        return {
          request_id: request.id,
          product_id: i.product_id,
          quantity: i.quantity,
          unit_price_snapshot: prod?.price || 0,
        };
      });
      const { error: itemsError } = await supabase.from('request_items').insert(itemData);
      if (itemsError) {
        console.error('Failed to insert request items:', itemsError);
      }
    }

    // Add services with price_snapshot and duration_snapshot, and hold slots
    if (services?.length) {
      const serviceData = services.map(s => {
        const svc = servicesList.find(item => item.id === s.service_id);
        return {
          request_id: request.id,
          service_id: s.service_id,
          slot_id: s.slot_id,
          price_snapshot: svc?.price || 0,
          duration_snapshot: svc?.duration_minutes || 0,
        };
      });
      const { error: servicesError } = await supabase.from('request_services').insert(serviceData);
      if (servicesError) {
        console.error('Failed to insert request services:', servicesError);
      }

    }

    // Notify both customer and owner without failing the booking if email delivery is unavailable.
    try {
      const customerInfo = {
        customerName: customer_name,
        customerEmail: customer_email,
        vehicleMake: vehicle_make || 'N/A',
        vehicleModel: vehicle_model || 'N/A',
      };
      const { data: ownerSetting } = await supabase
        .from('business_settings')
        .select('value')
        .eq('key', 'owner_email')
        .maybeSingle();
      const ownerEmail = typeof ownerSetting?.value === 'string' ? ownerSetting.value : config.OWNER_EMAIL;
      await Promise.allSettled([
        sendRequestConfirmation(customer_email, request, customerInfo),
        sendOwnerNotification(ownerEmail, request, customerInfo),
      ]);
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

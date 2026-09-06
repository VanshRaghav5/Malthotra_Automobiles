import { Router, Response } from 'express';
import { getSupabase } from '../lib/supabase';
import { authMiddleware, requireAdmin, AuthRequest } from '../middleware/auth';
import { generateGeminiResponse } from '../services/ai';

const adminRouter = () => {
  const router = Router();
  const supabase = getSupabase();

  // Middleware - all admin routes protected
  router.use(authMiddleware);
  router.use(requireAdmin);

  // GET /api/v1/admin/dashboard - Dashboard overview
  router.get('/dashboard', async (req: AuthRequest, res: Response) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    const [pendingRequests, todayBookings, upcomingBookings, productCount, unreadConversations] = await Promise.all([
      supabase.from('requests').select('id', { count: 'exact' }).in('status', ['submitted', 'under_review']),
      supabase.from('availability_slots').select('id', { count: 'exact' })
        .eq('date', today)
        .in('status', ['held', 'booked']),
      supabase.from('availability_slots').select('id', { count: 'exact' })
        .gte('date', today)
        .in('status', ['available', 'held']),
      supabase.from('products').select('id', { count: 'exact' }).eq('published', true),
      supabase.from('messages').select('id', { count: 'exact' }).is('read_at', null).eq('sender_type', 'admin'),
    ]);

    res.json({
      pendingRequests: pendingRequests.count || 0,
      todayBookings: todayBookings.count || 0,
      upcomingBookings: upcomingBookings.count || 0,
      productCount: productCount.count || 0,
      unreadConversations: unreadConversations.count || 0,
    });
  });

  // GET /api/v1/admin/requests - List all requests
  router.get('/requests', async (req: AuthRequest, res: Response) => {
    const { status, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const start = (pageNum - 1) * limitNum;

    let query = supabase
      .from('requests')
      .select('*, profiles(name, email), vehicles(*)', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);

    query = query.range(start, start + limitNum - 1);

    const { data, error, count } = await query;
    if (error) return res.status(500).json({ error: error.message });

    res.json({
      data,
      pagination: { page: pageNum, limit: limitNum, total: count || 0 },
    });
  });

  // PATCH /api/v1/admin/requests/:id/status - Update request status
  router.patch('/requests/:id/status', async (req: AuthRequest, res: Response) => {
    const { status } = req.body;
    const validStatuses = ['submitted', 'under_review', 'accepted', 'rejected', 'ready_for_visit', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const { data, error } = await supabase
      .from('requests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select('*, profiles(email)')
      .single();

    if (error) return res.status(500).json({ error: error.message });

    // Log audit
    await supabase.from('audit_logs').insert({
      admin_id: req.user!.id,
      action: 'update_request_status',
      entity_type: 'request',
      entity_id: req.params.id,
      metadata: { from: 'previous', to: status },
    });

    res.json(data);
  });

  // GET /api/v1/admin/customers - List customers
  router.get('/customers', async (req: AuthRequest, res: Response) => {
    const { search } = req.query;
    let query = supabase
      .from('profiles')
      .select('*, vehicles(*), requests(count)', { count: 'exact' })
      .eq('role', 'customer');

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, error, count } = await query.order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });

    res.json({
      data,
      pagination: { total: count || 0 },
    });
  });

  return router;
};

export default adminRouter;

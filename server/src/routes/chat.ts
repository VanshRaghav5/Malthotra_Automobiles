import { Router, Response } from 'express';
import { z } from 'zod';
import { getSupabase } from '../lib/supabase';
import { AuthRequest } from '../middleware/auth';

const messageSchema = z.object({
  content: z.string().min(1).max(2000),
});

const chatRouter = () => {
  const router = Router();
  const supabase = getSupabase();

  // GET /api/v1/chat/conversations - List user conversations
  router.get('/conversations', async (req: AuthRequest, res: Response) => {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const isAdmin = user.role === 'admin';
    const query = supabase
      .from('conversations')
      .select('*, messages(count)', isAdmin ? undefined : { count: 'exact' as const })
      .order('updated_at', { ascending: false });

    if (!isAdmin) {
      query.eq('customer_id', user.id);
    }

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  // POST /api/v1/chat/conversations - Create conversation
  router.post('/conversations', async (req: AuthRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { data, error } = await supabase
      .from('conversations')
      .insert({ customer_id: req.user.id })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(data);
  });

  // GET /api/v1/chat/conversations/:id/messages - Get messages
  router.get('/conversations/:id/messages', async (req: AuthRequest, res: Response) => {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('customer_id')
      .eq('id', req.params.id)
      .single();

    if (convError || !conversation) return res.status(404).json({ error: 'Conversation not found' });
    if (user.role !== 'admin' && conversation.customer_id !== user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', req.params.id)
      .order('created_at', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });

    // Mark as read if customer
    if (user.role === 'customer') {
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', req.params.id)
        .eq('sender_type', 'admin');
    }

    res.json(data);
  });

  // POST /api/v1/chat/conversations/:id/messages - Send message
  router.post('/conversations/:id/messages', async (req: AuthRequest, res: Response) => {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const parsed = messageSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });

    // Verify access
    const { data: conversation } = await supabase
      .from('conversations')
      .select('customer_id, status')
      .eq('id', req.params.id)
      .single();

    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    if (user.role !== 'admin' && conversation.customer_id !== user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (conversation.status === 'closed') {
      return res.status(400).json({ error: 'Conversation is closed' });
    }

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: req.params.id,
        content: parsed.data.content,
        sender_type: user.role === 'admin' ? 'admin' : 'customer',
        sender_id: user.id,
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    // Update conversation updated_at
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', req.params.id);

    res.status(201).json(data);
  });

  return router;
};

export default chatRouter;

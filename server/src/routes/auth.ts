import { Router, Response } from 'express';
import { getSupabase } from '../lib/supabase';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { config } from '../config';

const authRouter = () => {
  const router = Router();
  const supabase = getSupabase();

  // POST /api/v1/auth/signup - Sign up with email/password
  router.post('/signup', async (req: AuthRequest, res: Response) => {
    const { email, password, name, phone } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    // Create user via REST API (admin endpoint)
    // Note: Supabase admin API requires service role key as apikey header
    const createUserRes = await fetch(`${config.SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'apikey': config.SUPABASE_SERVICE_ROLE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, phone },
      }),
    });

    if (!createUserRes.ok) {
      const err = (await createUserRes.json().catch(() => ({}))) as any;
      return res.status(400).json({ error: err.error || err.msg || 'Failed to create account' });
    }

    const userData = (await createUserRes.json()) as any;
    const userId = userData.id;

    // Create profile
    const { error: profileError } = await supabase.from('profiles').insert({
      auth_user_id: userId,
      role: 'customer',
      name,
      phone: phone || null,
      email,
    });

    if (profileError) {
      // Cleanup auth user if profile creation fails
      await fetch(`${config.SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'apikey': config.SUPABASE_SERVICE_ROLE_KEY,
        },
      });
      return res.status(500).json({ error: 'Account could not be created. Please try again.' });
    }

    res.status(201).json({ message: 'Signup successful', user: { id: userId, email } });
  });

  // POST /api/v1/auth/signin - Sign in
  router.post('/signin', async (req: AuthRequest, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Sign in via REST API
    const signInRes = await fetch(`${config.SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': config.SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!signInRes.ok) {
      const err = (await signInRes.json().catch(() => ({}))) as any;
      return res.status(401).json({ error: err.error_description || err.msg || 'Invalid email or password' });
    }

    const signInData = (await signInRes.json()) as any;
    const token = signInData.access_token;
    const userId = signInData.user.id;

    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_user_id', userId)
      .single();

    if (profileError || !profile) {
      return res.status(500).json({ error: 'Account profile is incomplete. Please contact support.' });
    }

    res.json({
      user: { id: userId, email: signInData.user.email },
      profile,
      token,
    });
  });

  // POST /api/v1/auth/signout - Sign out
  router.post('/signout', async (req: AuthRequest, res: Response) => {
    res.json({ message: 'Signed out' });
  });

  // GET /api/v1/auth/me - Get current user
  router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    res.json({
      user: { id: req.user.auth_user_id, email: req.user.email },
      profile,
    });
  });

  return router;
};

export default authRouter;

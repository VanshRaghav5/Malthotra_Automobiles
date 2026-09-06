import { Router, Response } from 'express';
import { getSupabase } from '../lib/supabase';
import { AuthRequest } from '../middleware/auth';

const authRouter = () => {
  const router = Router();
  const supabase = getSupabase();

  // POST /api/v1/auth/signup - Sign up with email/password
  router.post('/signup', async (req: AuthRequest, res: Response) => {
    const { email, password, name, phone } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, phone },
      },
    });

    if (error) return res.status(400).json({ error: error.message });

    // Create profile
    if (data.user) {
      await supabase.from('profiles').insert({
        auth_user_id: data.user.id,
        role: 'customer',
        name,
        phone,
        email,
      });
    }

    res.status(201).json({ message: 'Signup successful', user: data.user });
  });

  // POST /api/v1/auth/signin - Sign in
  router.post('/signin', async (req: AuthRequest, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) return res.status(401).json({ error: error.message });

    // Fetch profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('auth_user_id', data.user.id)
      .single();

    res.json({
      user: data.user,
      profile,
      token: data.session?.access_token,
    });
  });

  // POST /api/v1/auth/signout - Sign out
  router.post('/signout', async (req: AuthRequest, res: Response) => {
    await supabase.auth.signOut();
    res.json({ message: 'Signed out' });
  });

  // GET /api/v1/auth/me - Get current user
  router.get('/me', async (req: AuthRequest, res: Response) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return res.status(401).json({ error: 'Not authenticated' });

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();

    res.json({ user, profile });
  });

  return router;
};

export default authRouter;

import { Request, Response, NextFunction } from 'express';
import { getSupabase } from '../lib/supabase';
import { config } from '../config';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    auth_user_id: string;
    role: 'customer' | 'admin';
    email: string;
    name?: string;
    phone?: string | null;
  };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization required' });
  }

  const token = authHeader.split(' ')[1];

  // Verify token via Supabase Auth REST API
  fetch(`${config.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'apikey': config.SUPABASE_ANON_KEY,
    },
  })
    .then(async (resp: any) => {
      if (!resp.ok || resp.status === 401) {
        return res.status(401).json({ error: 'Invalid token' });
      }
      const userData = await resp.json();
      return userData as { id: string; email: string };
    })
    .then((userData: any) => {
      if (!userData?.id) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      // Fetch profile to get role and details
      const supabase = getSupabase();
      return supabase
        .from('profiles')
        .select('id, auth_user_id, role, email, name, phone')
        .eq('auth_user_id', userData.id)
        .single() as any;
    })
    .then((result: any) => {
      const { data: profile, error: profileError } = result || {};
      if (profileError || !profile) {
        return res.status(403).json({ error: 'Profile not found' });
      }

      req.user = {
        id: profile.id,
        auth_user_id: profile.auth_user_id,
        role: profile.role as 'customer' | 'admin',
        email: profile.email,
        name: profile.name,
        phone: profile.phone,
      };
      next();
    })
    .catch(() => {
      return res.status(401).json({ error: 'Authentication failed' });
    });
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

export function requireCustomer(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'customer') {
    return res.status(403).json({ error: 'Customer access required' });
  }
  next();
}

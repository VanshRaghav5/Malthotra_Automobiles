import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config';
import { getSupabase } from '../lib/supabase';

export interface AuthRequest extends Request {
  user?: { id: string; role: 'customer' | 'admin'; email: string };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization required' });
  }

  const token = authHeader.split(' ')[1];
  const supabase = getSupabase();

  supabase.auth.getUser(token).then(({ data, error }) => {
    if (error || !data.user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Fetch profile to get role
    supabase
      .from('profiles')
      .select('role, email')
      .eq('auth_user_id', data.user.id)
      .single()
      .then(({ data: profile, error: profileError }) => {
        if (profileError || !profile) {
          return res.status(403).json({ error: 'Profile not found' });
        }

        req.user = {
          id: data.user.id,
          role: profile.role as 'customer' | 'admin',
          email: profile.email,
        };
        next();
      });
  }).catch(() => {
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
